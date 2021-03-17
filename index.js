const puppeteer = require("puppeteer");
const player = require("play-sound")((opts = {}));

const debugMode = false;

const sound = "./sounds/sonar.ogg";
const entryUrl = "https://ppt.mfa.gov.cn/appo/index.html";
const applicationNumber = "202102100415667";
const securityQuestion = "012D083B05E8426D9EA5B5619D08B495";
const answer = "hongan";
const consulateAddress = "13416bc41db64584b667ea76c90f7fb9";

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

async function homePage(page) {
  // await sleep(5000)
  if (page.$(".ui-button")) {
    console.log("saw notification");
    // await page.screenshot({ path: 'example.png' });
    const [ele] = await page.$x('//*[@id="body"]/div[9]/div[3]/div/button');
    await ele.click();
    console.log("dismissed");
  }

  await page.click("#continueReservation");

  await page.type("#recordNumberHuifu", applicationNumber);
  await page.select("#questionIDHuifu", securityQuestion);
  await page.type("#answerHuifu", answer);

  const [subbmit] = await page.$x(
    '//*[@id="body"]/div[5]/div[3]/div/button[1]'
  );
  await subbmit.click();
  // await sleep(50000)
}

async function reservationReview(page) {
  console.log("in reservation review page");
  const ele = await page.waitForSelector("#myButton");
  await ele.click();
}

async function checkSelectableDates(page, selectableDates) {
  let found = false;
  let played = false;
  for (let ele of selectableDates) {
    const text = await page.evaluate((element) => element.textContent, ele);
    const [booked, cap] = text.split("/");
    debugMode &&
      console.log(
        "booked, cap",
        booked,
        cap,
        parseInt(booked) === parseInt(cap)
      );
    if (parseInt(booked) === parseInt(cap)) {
      //   console.log("\u0007");

      if (!played) {
        player.play(sound);
        played = true;
      }
      found = true;
    }
  }
  return found;
}

async function reservation(page) {
  const ele = await page.waitForXPath("/html/body/div[6]/div[3]/div/button");
  if (ele) {
    console.log("saw reservation dialog");
    await ele.click();
  }

  // select ban li
  await page.select("#address", consulateAddress);
  await sleep(200);

  let found = false;
  while (true) {
    const element = await page.$("h2");
    const text = await page.evaluate((element) => element.textContent, element);
    debugMode && console.log(`current month: ${text}`);

    const selectableDates = await page.$$(".fc-event-title");
    debugMode && console.log(`selectable date: ${selectableDates.length}`);
    found = found || (await checkSelectableDates(page, selectableDates));
    if (text === "六月 2021") {
      break;
    }

    const [nextBtn] = await page.$x(
      '//*[@id="calendar"]/table/tbody/tr/td[3]/span'
    );
    await nextBtn.click();
    await sleep(100);
  }
  return found;
  // if (page.$('h2'))
}

async function launch() {
  const browser = await puppeteer.launch({ headless: false });
  let foundAvailable = false;
  while (!foundAvailable) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 1366 });
    await page.goto(entryUrl, { waitUntil: "domcontentloaded" });
    await homePage(page);
    await reservationReview(page);
    foundAvailable = await reservation(page);
    debugMode && console.log("foundAvailable", foundAvailable);
    if (!foundAvailable) {
      console.log("Available date not found, close page and try in 5 seconds");
      await page.close();
      await sleep(5000);
    }
    // sleep 5 seconds
  }
}

launch();
