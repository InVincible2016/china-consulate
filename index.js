require('chromedriver')
const {Builder, By, Key, until} = require('selenium-webdriver');
const entryUrl = 'https://ppt.mfa.gov.cn/appo/page/agreement.html'



async function apply() {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get(entryUrl);
    await (await driver.findElement(By.id('agreeText'))).click()
    await (await driver.findElement(By.id('myButton'))).click()
    await driver.wait(until.titleIs('webdriver - Google Search'), 1000);
  } finally {
    // await driver.quit();
  }
}



apply()


