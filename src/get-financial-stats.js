//
//IMPORTS
//
const fs        = require('fs-extra');
const puppeteer = require('puppeteer');

const prepareTraversal = require('./nodes-traversal').prepare;
const exposeGetters    = require('./nodes-traversal').exposeGetters;

//
//CONSTS
//
const GF_ENDPOINT          = "https://www.google.com/search?stick=H4sIAAAAAAAAAOPQeMSozC3w8sc9YSmpSWtOXmMU4RJyy8xLzEtO9UnMS8nMSw9ITE_lAQCCiJIYKAAAAA&q=finance&tbm=fin";
const YF_ENDPOINT          = "https://finance.yahoo.com/";
const FRED_ENDPOINT        = "https://fred.stlouisfed.org/series/";
const YIELD_CURVE_ENDPOINT = "https://www.bondsupermart.com/main/market-info/yield-curves-chart";
const TIMERANGES           = [ '1Y', '5Y', '40Y' ];

//
//FUNCTIONS
//
async function saveSingleImage( element, imageName, config, logger ){
	
	const imageFullPath = config.assets_dir + imageName + '.jpg';
	logger(`📸 Saving file: ${imageFullPath}...`);
	
	return await element.screenshot({path : imageFullPath});
	
}

function createAssetsDirectory( config ){
	
	if ( !fs.existsSync(config.assets_dir) ) {
		fs.mkdirSync(config.assets_dir);
	}
	
}

async function changeTimeRange( page, timeRange, config ){
	
	await page.evaluate(( timeRange ) =>{
		
		const button = getters.GET_TIMERANGE_BTN(timeRange);
		button.click();
		
	}, timeRange);
	
	await page.waitFor(config.ajaxChartWaitTime);
	
}

async function gatherCharts( page, ticker, config ){
	
	await goto(page, GF_ENDPOINT);
	
	await navigateToTicker(page, ticker, 'GF');
	
	let elementData   = {};
	let chartsHTMLTmp = '';
	
	elementData.chartsHTML = '';
	
	for ( let timeRange of TIMERANGES ) {
		
		await changeTimeRange(page, timeRange, config);
		
		chartsHTMLTmp = await page.evaluate(() =>{
			return getters.SVG_DOM_CHART_CLONE();
		});
		
		elementData.chartsHTML += createChartHTML(timeRange, chartsHTMLTmp);
		
	}
	
	return elementData;
	
}

function createChartHTML( timeRange, chartHTML ){
	
	let chartTemplate = fs.readFileSync('./templates/chart-template.html', 'utf8');
	chartTemplate     = chartTemplate.replace('{{{timeRange}}}', timeRangeToDisplayValue(timeRange));
	return chartTemplate.replace('{{{chart}}}', chartHTML);
	
}

async function gatherData( elementData, page, ticker ){
	
	await goto(page, YF_ENDPOINT);
	await navigateToTicker(page, ticker, 'YF');
	await navigateToStatistics(page);
	
	elementData.ticker = ticker;
	
	elementData = await page.evaluate(( elementData ) =>{
		
		elementData.name     = getters.NAME();
		elementData.currency = getters.CURRENCY();
		
		elementData.price        = getters.PRICE();
		elementData.eps          = getters.EPS();
		elementData.tr_p_e       = getters.TR_PE();
		//elementData.fw_p_e        = getters.FW_PE();
		elementData.book_ps      = getters.BOOK_PS();
		elementData.p_book       = getters.P_BOOK();
		elementData.div_yield    = getters.DIV_YIELD();
		elementData.payout_ratio = getters.PAYOUT_RATIO();
		
		elementData.revenue     = getters.REVENUE();
		elementData.g_profit    = getters.G_PROFIT();
		elementData.net_income  = getters.NET_INCOME();
		elementData.prof_margin = getters.PROF_MARGIN();
		elementData.debt        = getters.DEBT();
		elementData.debt_equity = getters.DEBT_EQUITY();
		elementData.curr_ratio  = getters.CURR_RATIO();
		
		elementData.w52_h         = getters.W52_H();
		elementData.w52_l         = getters.W52_L();
		elementData.w52_c         = getters.W52_C();
		elementData.avg_vol       = getters.AVG_VOL();
		elementData.ret_on_equity = getters.RET_ON_EQUITY();
		elementData.shorted       = getters.SHORTED();
		elementData.cap           = getters.CAP();
		//elementData.ret_on_assets = getters.RET_ON_ASSETS();
		//elementData.short_ratio   = getters.SHORT_RATIO();
		//elementData.beta          = getters.BETA();
		
		return elementData;
		
	}, elementData);
	
	await page.waitFor(500);
	return elementData;
	
}

function replacePlaceholders( HTML, data ){
	
	for ( let key in data ) {
		let regexp = new RegExp(`{{{${key}}}}`, 'g');
		HTML       = HTML.replace(regexp, data[ key ]);
	}
	
	return HTML;
	
}

async function convertToHTMLOutput( page, data, config, isEFT ){
	
	let tickerTemplate;
	
	if ( !isEFT ) {
		
		tickerTemplate = fs.readFileSync('./templates/ticker-template.html', 'utf8');
		tickerTemplate = replacePlaceholders(tickerTemplate, data);
		
		let infoTemplate = fs.readFileSync('./templates/info-template.html', 'utf8');
		tickerTemplate   = tickerTemplate.replace('{{{info}}}', replacePlaceholders(infoTemplate, data));
		
	} else {
		
		tickerTemplate = fs.readFileSync('./templates/ticker-template-etf.html', 'utf8');
		tickerTemplate = replacePlaceholders(tickerTemplate, data);
		
	}
	
	return config.strategy_fn(tickerTemplate, data);
	
}

function timeRangeToDisplayValue( timeRange ){
	
	switch ( timeRange ) {
		
		case "1Y":
			return '1 Year';
		
		case "5Y":
			return '5 Years';
		
		case "40Y":
			return 'Max';
		
		default:
			return "";
		
	}
	
}

function deleteOldFiles( config, logger ){
	
	logger(`🌀 Removing old files...`);
	fs.removeSync(config.save_to_dir + config.file_name);
	fs.removeSync(config.save_to_dir + config.assets_dir_name);
	
}

function copyAssets( logger, config ){
	
	logger(`📦 Copying assets files...`);
	const from = './templates/';
	
	[ 'styles.css', 'reset.css', 'favicon.ico' ].forEach(file =>{
		fs.copyFileSync(from + file, config.assets_dir + file);
	});
	
}

function createFinalHTMLPage( HTMLStocks, HTMLETFs, HTMLMarkets, config, logger ){
	
	logger(`📦 Creating final HTML page...`);
	
	let finalPage = fs.readFileSync('./templates/base.html', 'utf8');
	
	finalPage = finalPage.replace(/{{{assets_dir}}}/g, config.assets_dir_name);
	finalPage = finalPage.replace('{{{data-stocks}}}', HTMLStocks);
	finalPage = finalPage.replace('{{{data-etfs}}}', HTMLETFs);
	finalPage = finalPage.replace('{{{data-markets}}}', HTMLMarkets);
	
	fs.writeFileSync(config.save_to_dir + config.file_name, finalPage);
	
}

async function navigateToStatistics( page ){
	
	const navigationPromise = waitForNavigation(page);
	
	await page.evaluate(() =>{
		$('a:contains("Statistics")')[ 0 ].click();
	});
	await navigationPromise;
	
	await prepareTraversal(page);
	await exposeGetters(page);
	
}

async function prepareYahoo( page ){
	
	await goto(page, YF_ENDPOINT);
	
	const navigationPromise = waitForNavigation(page);
	await page.evaluate(() =>{
		document.querySelector('input.btn').click();
	});
	await navigationPromise;
	
}

async function navigateToTicker( page, ticker, mode ){
	
	await exposeGetters(page);
	
	const navigationPromise = waitForNavigation(page);
	await page.evaluate(( ticker, mode ) =>{
		
		const input = getters[ mode + '_GET_SEARCH_FIELD' ]();
		const form  = getters[ mode + '_GET_SEARCH_FORM' ]();
		
		input.value = ticker;
		form.submit();
		
	}, ticker, mode);
	await navigationPromise;
	
	await prepareTraversal(page);
	await exposeGetters(page);
	
}

async function createPagePool( config, browser, logger ){
	
	const pool = [];
	let page;
	
	logger(`🤖 Creating a pool of ${config.pool_size} concurrent workers...`);
	
	for ( let i = 0; i < config.pool_size; i++ ) {
		page = await browser.newPage();
		pool.push(page);
	}
	
	return pool;
	
}

async function goto( page, url ){
	
	await page.goto(url, {
		waitUntil : 'load',
		timeout   : 0
	});
	
}

function waitForNavigation( page ){
	
	return page.waitForNavigation({
		waitUntil : 'load',
		timeout   : 0
	});
	
}

async function removeUnusedDataFromBondYieldCurveChart( page ){
	
	await page.evaluate(() =>{
		$('tspan:contains("1 Week")').click();
		$('tspan:contains("1 Month")').click();
	});
	
}

async function changeCountryOfYieldCurveChart( page, name ){
	
	await page.evaluate(name =>{
		$('#countrySelect li:contains("' + name + '")').click();
	}, name);
	await page.waitFor(2000);
	
}

async function maximiseFREDChart( page ){
	
	await page.evaluate(() =>{
		$('#zoom-all').click();
	});
	await page.waitFor(250);
	
}

async function getMarketsHTML( browser, config, logger ){
	
	logger(`➡️  Processing the General Market Indicators...`);
	
	const page = await browser.newPage();
	return await getData();
	
	async function getData(){
		
		let attempt = 1;
		
		return new Promise(async ( resolve, reject ) =>{
			
			await goto(page, FRED_ENDPOINT + 'T10Y2Y');
			await page.waitFor(3000);
			await maximiseFREDChart(page);
			await saveSingleImage(await page.$('.highcharts-container'), "T10Y2Y", config, logger);
			
			await goto(page, FRED_ENDPOINT + 'UNRATE');
			await page.waitFor(3000);
			await maximiseFREDChart(page);
			await saveSingleImage(await page.$('.highcharts-container'), "UNRATE", config, logger);
			
			await goto(page, YIELD_CURVE_ENDPOINT);
			await page.waitFor(3000);
			for ( let country of [ "Japan", "United States", "Euro", "China", "India" ] ) {
				await changeCountryOfYieldCurveChart(page, country);
				await removeUnusedDataFromBondYieldCurveChart(page);
				page.waitFor(1500);
				await saveSingleImage(await page.$('.highcharts-container'), "YC-" + country.replace(" ", "-"), config, logger);
			}
			
			let HTML = fs.readFileSync('./templates/markets.html', 'utf8');
			HTML     = HTML.replace(/{{{assets_dir}}}/g, config.assets_dir_name);
			resolve(HTML);
			
		}).catch(async err =>{
			
			logger(`🔥 An error occurred while gathering the Markets overview. ` + err);
			logger(`🤖 Retrying to process the data (attempt ${++attempt} of ${config.max_retry})...`);
			
			if ( attempt <= config.max_retry ) {
				return await getData();
			} else {
				logger(`🤖 Not able to get the Market overview data.`);
				return "";
			}
			
		});
		
	}
	
}

async function process( config, browser, logger ){
	
	deleteOldFiles(config, logger);
	createAssetsDirectory(config);
	
	const HTMLStocks = await processList(config.tickers, false, config, browser, logger);
	logger(`👍️ All Stocks have been processed!`);
	
	const HTMLETFs = await processList(config.tickersETFs, true, config, browser, logger);
	logger(`👍️ All ETFs have been processed!`);
	
	const HTMLMarkets = await getMarketsHTML(browser, config, logger);
	logger(`👍️ All the Market-indicator charts have been processed!`);
	
	copyAssets(logger, config);
	createFinalHTMLPage(HTMLStocks, HTMLETFs, HTMLMarkets, config, logger);
	
}

async function processList( list, isETF, config, browser, logger ){
	
	if ( !list.length ) {
		return "";
	}
	
	logger(`➡️  Processing the ${isETF ? "ETFs" : "Stocks"}...`);
	
	const pool         = await createPagePool(config, browser, logger);
	const poolPromises = [];
	
	let currentIndex  = 0;
	let HTMLDataArray = [];
	
	if ( !isETF ) {
		await prepareYahoo(pool[ 0 ]);
	}
	
	for ( let [ index, worker ] of pool.entries() ) {
		poolPromises.push(processSingleTicker(worker, ++index));
	}
	
	return Promise.all(poolPromises).then(() =>{
		return HTMLDataArray.join('');
	});
	
	function processSingleTicker( page, workerID ){
		
		const tickers = list;
		const index   = currentIndex;
		let attempt   = 1;
		currentIndex++;
		
		return new Promise(async function( resolve, reject ){
			
			if ( index >= tickers.length ) {
				logger(`🤖 [worker#${workerID}]: no tickers left, unloading!`);
				page.close();
				return resolve();
			}
			
			const ticker = tickers[ index ];
			logger(`🤖 [worker#${workerID}]: processing ticker "${ticker[ 0 ]}"...`);
			await process();
			
			return resolve(processSingleTicker(page, workerID));
			
			async function process(){
				
				await new Promise(async ( resolve, reject ) =>{
					
					let data = await gatherCharts(page, ticker[ 0 ], config);
					
					if ( !isETF ) { //ETFs have no enough data.
						data = await gatherData(data, page, ticker[ 1 ]);
					} else {
						data.name = ticker[ 1 ];
					}
					
					HTMLDataArray[ index ] = await convertToHTMLOutput(page, data, config, isETF);
					resolve();
					
				}).catch(async err =>{
					
					logger(`🔥 An error occurred on Ticker "${ticker[ 0 ]}". ` + err);
					logger(`🤖 [worker#${workerID}]: retrying to process ticker "${ticker[ 0 ]}" (attempt ${++attempt} of ${config.max_retry})...`);
					
					if ( attempt <= config.max_retry ) {
						await process();
					} else {
						logger(`🤖 [worker#${workerID}]: not able to process ticker "${ticker[ 0 ]}".`);
					}
					
				});
				
			}
			
		});
		
	}
	
}

//
//MAIN
//
async function execute( config, logger ){
	
	logger('⚡️ Starting...');
	config.assets_dir = config.save_to_dir + config.assets_dir_name + '/';
	
	const browser = await puppeteer.launch({
		args     : [ '--lang=en-GB' ],
		timeout  : 0,
		//headless : false
	});
	
	await process(config, browser, logger).then(() =>{
		logger('🌈 Task completed!');
	}).catch(( err ) =>{
		logger('🔥 An error occurred. ' + err);
		deleteOldFiles(config, logger);
	});
	
	logger('🌀 Unloading resources...');
	await browser.close();
	logger('👍 Finished!');
	
}

//
//EXPORTS
//
module.exports = {execute};