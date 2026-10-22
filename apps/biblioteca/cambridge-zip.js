/* Local-only Cambridge audiobook ZIP reader.
 * Only uncompressed (ZIP_STORED) archives are accepted, produced by our local packer.
 * No remote services, dynamic imports, or third-party dependencies.
 */
(()=>{
'use strict';
const MAX_ENTRIES=120;
const err=message=>new Error(message);
async function unpack(file){
 if(!file || file.size<22)throw err('Paquete ZIP vacío o dañado.');
 const tailLength=Math.min(file.size,65557);
 const tail=new DataView(await file.slice(file.size-tailLength).arrayBuffer());
 let end=-1;
 for(let i=tail.byteLength-22;i>=0;i--){
  if(tail.getUint32(i,true)===0x06054b50 && i+22+tail.getUint16(i+20,true)===tail.byteLength){end=i;break}
 }
 if(end<0)throw err('ZIP incompleto o no reconocido.');
 const count=tail.getUint16(end+10,true),total=tail.getUint16(end+8,true);
 const length=tail.getUint32(end+12,true),offset=tail.getUint32(end+16,true);
 if(tail.getUint16(end+4,true)||tail.getUint16(end+6,true)||count!==total||
    count>MAX_ENTRIES||count===0||length===0||offset===0xffffffff||
    length===0xffffffff||offset+length>file.size-tailLength+end)
  throw err('ZIP no compatible o con demasiados archivos.');
 const dir=new DataView(await file.slice(offset,offset+length).arrayBuffer());
 const decoder=new TextDecoder('utf-8',{fatal:true});
 const files=[];
 let i=0;
 for(let n=0;n<count;n++){
  if(i+46>dir.byteLength||dir.getUint32(i,true)!==0x02014b50)throw err('Índice ZIP dañado.');
  const flags=dir.getUint16(i+8,true),method=dir.getUint16(i+10,true);
  const size=dir.getUint32(i+20,true),raw=dir.getUint32(i+24,true);
  const nameSize=dir.getUint16(i+28,true),extra=dir.getUint16(i+30,true);
  const comment=dir.getUint16(i+32,true),disk=dir.getUint16(i+34,true);
  const localOffset=dir.getUint32(i+42,true);
  if(i+46+nameSize+extra+comment>dir.byteLength||disk!==0||(flags&1)||
     size===0xffffffff||raw===0xffffffff||localOffset===0xffffffff)
   throw err('Archivo ZIP dañado o cifrado.');
  const name=decoder.decode(new Uint8Array(dir.buffer,dir.byteOffset+i+46,nameSize));
  i+=46+nameSize+extra+comment;
  if(name.endsWith('/'))continue;
  if(method!==0||size!==raw)throw err('El paquete debe ser ZIP sin compresión, preparado para el Hub.');
  if(!/^[^/\\]+\.mp3$/i.test(name)||size<10000||size>120000000)
   throw err('El ZIP contiene un archivo no admitido: '+name);
  if(localOffset+30>offset)throw err('Cabecera ZIP dañada.');
  const local=new DataView(await file.slice(localOffset,localOffset+30).arrayBuffer());
  if(local.getUint32(0,true)!==0x04034b50||local.getUint16(8,true)!==0)
   throw err('Cabecera MP3 dañada.');
  const start=localOffset+30+local.getUint16(26,true)+local.getUint16(28,true);
  if(start+size>offset)throw err('MP3 fuera de los límites del ZIP.');
  files.push(new File([file.slice(start,start+size)],name,{type:'audio/mpeg'}));
 }
 if(!files.length)throw err('El ZIP no contiene MP3.');
 return files;
}
window.CambridgeZip={unpack};
})();
