const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
require('dotenv').config()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

puppeteer.launch({ headless: false, defaultViewport: {width: 1280, height: 720}, userDataDir: 'ChromeSession' }).then(async browser => {

  process.on('SIGINT', () => {
    console.log("received SIGINT")
    await browser.close()
    process.exit(0);
  });

  const page = await browser.newPage()
  await page.goto(process.env.url, {waitUntil: 'networkidle0'})
  console.log("Page loaded")

  if (page.waitForSelector('a.cc-btn:nth-child(2)')) {
    await page.click('a.cc-btn:nth-child(2)')
    console.log("Clicked on accept cookies")
  }

  if (page.url().match(/sign_in/)) {
    console.log("Logging in")
    await page.waitForSelector('#user_email')
    await page.type('#user_email', process.env.email)
    await page.type('#user_password', process.env.password)
    await page.click('input.btn')
    await page.waitForNavigation()
  } else {
    console.log("already logged in")
  }

  /*
  var dernière date de reload
  chaque onglet va check si sa fait plus d'une second qu'il y a une un reload,
  si non il reload dans 1sec - var de dernier reload et set var de dernier reload

  aller sur la page ou le bouton change et scroll jusqu'au bouton
  detecte si le boutton est actif/match string et click dessus, puis cherche sur un autre boutton oui/confirmer
  */


})

