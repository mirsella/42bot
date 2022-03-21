const puppeteer = require('puppeteer-extra')

const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
require('dotenv').config()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

puppeteer.launch({ headless: false, defaultViewport: {width: 1280, height: 720}, userDataDir: 'ChromeSession' }).then(async browser => {

  process.on('SIGINT', async () => {
    console.log("received SIGINT")
    await browser.close()
    process.exit(0);
  });

  const pageLogin = await browser.newPage()
  await pageLogin.goto(process.env.url, {waitUntil: 'networkidle0'})
  console.log("Page loaded")

  const cookiesVisibility = await pageLogin.$eval('.cc-allow', (elem) => {
    return window.getComputedStyle(elem).getPropertyValue('display') !== 'none' && elem.offsetHeight
  })

  if (cookiesVisibility) {
    cookies = await pageLogin.$('.cc-allow')
    await cookies.click()
    console.log("Clicked on accept cookies")
  }

  if (pageLogin.url().match(/sign_in/)) {
    console.log("Logging in")
    await pageLogin.waitForSelector('#user_email')
    await pageLogin.type('#user_email', process.env.email)
    await pageLogin.type('#user_password', process.env.password)
    await pageLogin.click('input.btn')
    await pageLogin.waitForNavigation()
  } else {
    console.log("already logged in")
  }
  pageLogin.close()

  let lastReload = new Date()
  let pageCount = 1

  class admission {

    constructor() {
      this.pageIndex = pageCount
      pageCount += 1
      this.refreshing = true;
      (async () => {
        const page = await browser.newPage()
        while (this.refreshing) {
          let now = new Date()
          if (now - lastReload > 1000) {
            lastReload = now
            await this.refresh(page)
          }
          await sleep(100)
        }
      })()
    }

    async refresh(page) {
      await page.goto(process.env.url)
      await page.waitForSelector('input.btn')
      const btn = await page.$('input.btn')
      const btnValue = await (await btn.getProperty('value')).jsonValue()
      console.log("page: ", this.pageIndex, btnValue)
      if (! btnValue.match(/impossible/i)) {
        this.submit(page)
      }

    }

    async submit(page) {
      this.refreshing = false

      await page.$x('input.btn', (btn) => {
        btn.scrollIntoView()
      })

      // click on button
      try {
        await page.click('input.btn')
        console.log("clicked on button")
      } catch (e) {
        console.log("error clicked on button: ", e)
      }

      // submit form
      try {
        await page.$x('.col-lg-3 > form:nth-child(1)', (elem) => {
          elem.submit()
        })
        console.log("submitted form")
      } catch (e) {
        console.log("error submitting form: ", e)
      }

    }
  }
  parallel = 3
  for (let i = 0; i < parallel; i++) {
    new admission()
  }
})

