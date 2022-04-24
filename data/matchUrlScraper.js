const scraperArgumentValidator = require('./scraperArgumentValidator.js');
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const SEASON = scraperArgumentValidator.validateSeasonArgument();

//globals
let BROWSER;
let PAGE;
let URLs;

if (SEASON === "18-19"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7361/Stages/16368/Fixtures/England-Premier-League-2018-2019",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7466/Stages/16546/Fixtures/Spain-LaLiga-2018-2019",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7468/Stages/16548/Fixtures/Italy-Serie-A-2018-2019",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7405/Stages/16427/Fixtures/Germany-Bundesliga-2018-2019",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7344/Stages/16348/Fixtures/France-Ligue-1-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7352/Stages/16651/Show/Europe-Champions-League-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7352/Stages/16704/Show/Europe-Champions-League-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7353/Stages/16786/Show/Europe-Europa-League-2018-2019",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7353/Stages/16705/Show/Europe-Europa-League-2018-2019"
    ];
}
else if (SEASON === "19-20"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/7811/Stages/17590/Fixtures/England-Premier-League-2019-2020",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/7889/Stages/17702/Fixtures/Spain-LaLiga-2019-2020",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/7928/Stages/17835/Fixtures/Italy-Serie-A-2019-2020",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/7872/Stages/17682/Fixtures/Germany-Bundesliga-2019-2020",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/7814/Stages/17593/Fixtures/France-Ligue-1-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7804/Stages/18065/Show/Europe-Champions-League-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/7804/Stages/17993/Show/Europe-Champions-League-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7805/Stages/18066/Show/Europe-Europa-League-2019-2020",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/7805/Stages/17994/Show/Europe-Europa-League-2019-2020"
    ];
}
else if (SEASON === "20-21"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/8228/Stages/18685/Fixtures/England-Premier-League-2020-2021",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/8321/Stages/18851/Fixtures/Spain-LaLiga-2020-2021",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/8330/Stages/18873/Fixtures/Italy-Serie-A-2020-2021",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/8279/Stages/18762/Fixtures/Germany-Bundesliga-2020-2021",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/8185/Stages/18594/Fixtures/France-Ligue-1-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/8177/Stages/19130/Show/Europe-Champions-League-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/8177/Stages/19009/Show/Europe-Champions-League-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/8178/Stages/19164/Show/Europe-Europa-League-2020-2021",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/8178/Stages/19010/Show/Europe-Europa-League-2020-2021"
    ];
}
else if (SEASON === "21-22"){
    URLs = [
        "https://www.whoscored.com/Regions/252/Tournaments/2/Seasons/8618/Stages/19793/Fixtures/England-Premier-League-2021-2022",
        "https://www.whoscored.com/Regions/206/Tournaments/4/Seasons/8681/Stages/19895/Fixtures/Spain-LaLiga-2021-2022",
        "https://www.whoscored.com/Regions/108/Tournaments/5/Seasons/8735/Stages/19982/Fixtures/Italy-Serie-A-2021-2022",
        "https://www.whoscored.com/Regions/81/Tournaments/3/Seasons/8667/Stages/19862/Fixtures/Germany-Bundesliga-2021-2022",
        "https://www.whoscored.com/Regions/74/Tournaments/22/Seasons/8671/Stages/19866/Fixtures/France-Ligue-1-2021-2022",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/8623/Stages/20265/Show/Europe-Champions-League-2021-2022",
        "https://www.whoscored.com/Regions/250/Tournaments/12/Seasons/8623/Stages/20149/Show/Europe-Champions-League-2021-2022",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/8741/Stages/20266/Show/Europe-Europa-League-2021-2022",
        "https://www.whoscored.com/Regions/250/Tournaments/30/Seasons/8741/Stages/20148/Show/Europe-Europa-League-2021-2022"
    ];
}

let MATCH_URLs = [];

/**
 * Launches a browser window using puppeteer and navigates to the appropriate URL based on the command line arguments
 * @returns {Promise<*>} Promise resolves when the browser has been successfully launched
 */
let setup = async () => {

    console.time('browser launch');

    BROWSER = await puppeteer.launch({
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: null
    });

    PAGE = await BROWSER.newPage();

    await PAGE.setDefaultNavigationTimeout(0);
    await disableImages(PAGE);

    console.timeEnd('browser launch');

};


/**
 * Disables image loading in puppeteer tabs
 * @param {*} page - The page where image loading is to be disabled
 * @returns {Promise<void>}
 */
let disableImages = async(page) => {

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(req.resourceType() === 'image'){
            req.abort();
        }
        else {
            req.continue();
        }
    });

};

let getMatchUrls = async() => {

    for (let i = 0; i < URLs.length; i++) {
        await PAGE.goto(URLs[i], {waitUntil: 'networkidle2'});
        await PAGE.waitFor(5000);
        await scrapeMatchUrls();
    }

};

let scrapeMatchUrls = async() => {

    let hasPreviousPage = true;

    let fixturesSelector = '#tournament-fixture';
    await PAGE.waitForSelector(fixturesSelector);

    while (hasPreviousPage) {

        let result = await PAGE.evaluate(() => {

            const partialMatchUrls = Array.from(document.querySelectorAll('#tournament-fixture .result-1'), a => a.getAttribute('href'))

            let fullMatchUrls = partialMatchUrls
                .map(m => {
                   return `https://www.whoscored.com${m}`;
                });

            fullMatchUrls = [...new Set(fullMatchUrls)];

            return fullMatchUrls;

        });

        result.forEach(u => {
            MATCH_URLs.push(u);
        });

        //button to go back to previous set of fixtures
        let selector = '#date-controller > a.previous.button.ui-state-default.rc-l.is-default';

        //loop until we reach the back button is disabled (i.e. we're on the first page)
        if (await PAGE.$(selector) !== null){
            await PAGE.waitForSelector(selector);
            await PAGE.evaluate((selector) => document.querySelector(selector).click(), selector);
            await PAGE.waitFor(1500);
        }
        else {
            hasPreviousPage = false;
        }

    }

    MATCH_URLs = [...new Set(MATCH_URLs)];

};

let main = async () => {

    console.time('match url retrieval');

    await setup();
    await getMatchUrls();

    fs.writeFileSync(
        path.join(__dirname, `matchUrls/${SEASON}.json`),
        JSON.stringify(MATCH_URLs, null, '\t'),
        function(err) {
            if (err) {
                console.log(err);
            }
        }
    );

    console.timeEnd('match url retrieval');

};

main()
    .then(() => {
        process.exit(0)
    })
    .catch(async (anError) => {
        console.log(anError);
        process.exit(-1);
    });