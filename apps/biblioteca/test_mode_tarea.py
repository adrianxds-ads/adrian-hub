from playwright.sync_api import sync_playwright
url='http://127.0.0.1:19543/apps/biblioteca/'
with sync_playwright() as p:
  browser=p.chromium.launch(channel="msedge",headless=True)
  for label,viewport in [('mobile',{'width':412,'height':915}),('landscape',{'width':915,'height':412})]:
    page=browser.new_page(viewport=viewport)
    errors=[]
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.goto(url,wait_until='domcontentloaded')
    page.locator('#episodes .episode').first.wait_for(timeout=20000)
    assert page.locator('#episodes .episode').count()==233
    page.locator('#tabTasks').click()
    page.locator('#taskEpisodes .episode').first.wait_for()
    assert page.locator('#taskEpisodes .episode').count()==233
    assert page.locator('#episodes').is_hidden()
    page.locator('#search').fill('Posem fil')
    assert page.locator('#taskEpisodes .episode').count()>=1
    page.locator('#search').fill('')
    page.locator('#taskEpisodes [data-task-episode="1"]').first.click()
    assert page.locator('#taskSetup').is_visible()
    page.locator('#taskText').fill('Ordenar el escritorio')
    page.locator('#taskSetupButton').click()
    assert page.locator('#taskStage').is_visible()
    assert page.locator('#taskStage button').count()==2
    assert page.locator('#taskStageTask').inner_text()=='Ordenar el escritorio'
    page.evaluate("document.getElementById('audio').dispatchEvent(new Event('ended'))")
    assert page.locator('#taskStage').is_hidden()
    assert page.locator('#taskBreak').is_visible()
    assert page.locator('#taskTotal').inner_text()=='1'
    data=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskSessionsV1'))")
    assert len(data)==1 and data[0]['status']=='completado' and data[0]['episodeNumber']==1
    page.locator('#taskStatsToggle').click()
    assert page.locator('#taskChart .task-day').count()>=1
    page.locator('#taskChartOpen').click()
    assert page.locator('#taskChartDialog').is_visible()
    page.locator('#taskChartClose').click()
    page.locator('#taskEpisodes [data-task-episode="2"]').first.click()
    page.locator('#taskText').fill('Recoger la cocina')
    page.locator('#taskSetupButton').click()
    assert page.locator('#taskBreak').is_visible()
    live=page.evaluate("JSON.parse(localStorage.getItem('adrianEasyCatalanTaskLiveV1'))")
    assert live['queue']['episodeNumber']==2
    page.reload(wait_until='domcontentloaded')
    page.locator('#episodes .episode').first.wait_for(timeout=20000)
    page.locator('#tabTasks').click()
    assert page.locator('#taskBreak').is_visible()
    page.locator('#tabPodcasts').click()
    assert page.locator('#episodes').is_visible()
    assert page.locator('#taskPanel').is_hidden()
    assert not errors,errors
    print('PASS',label,'catalog=233, task/session/10min-break/queue/chart/reload/original mode')
    page.close()
  browser.close()
