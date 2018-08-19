//
//IMPORTS
//
const fs        = require('fs-extra');
const puppeteer = require('puppeteer');

const prepareTraversal = require('./nodes-traversal').prepare;
const exposeGetters    = require('./nodes-traversal').exposeGetters;

const GF_ENDPOINT = "https://www.google.com/search?stick=H4sIAAAAAAAAAOPQeMSozC3w8sc9YSmpSWtOXmMU4RJyy8xLzEtO9UnMS8nMSw9ITE_lAQCCiJIYKAAAAA&q=finance&tbm=fin";
const YF_ENDPOINT = "https://finance.yahoo.com/";
const TIMERANGES  = [ '1Y', '5Y', '40Y' ];

//
//FUNCTIONS
//
async function saveSingleImage( element, imageName, config, logger ){
	
	const dest          = config.save_to_dir + config.assets_dir_name + '/';
	const imageFullPath = dest + imageName + '.jpg';
	
	logger(`📸 Saving file: ${imageFullPath}...`);
	
	return await element.screenshot({path : imageFullPath});
	
}

function createAssetsDirectory( config ){
	
	const dest = config.save_to_dir + config.assets_dir_name + '/';
	if ( !fs.existsSync(dest) ) {
		fs.mkdirSync(dest);
	}
	
}

async function changeTimeRange( page, timeRange, config ){
	
	await page.evaluate(( timeRange ) =>{
		
		const button = getters.GET_TIMERANGE_BTN(timeRange);
		button.click();
		
	}, timeRange);
	
	await page.waitFor(config.ajaxChartWaitTime);
	
}

async function gatherCharts( page, ticker, config, logger ){
	
	await page.goto(GF_ENDPOINT, {
		waitUntil : 'load',
		timeout   : 0
	});
	
	await navigateToTicker(page, ticker, 'GF');
	
	let elementData = {};
	
	elementData.chartsHTML    = '';
	elementData.chartsHTMLTmp = '';
	
	for ( let timeRange of TIMERANGES ) {
		
		await changeTimeRange(page, timeRange, config);
		
		if ( config.use_images ) {
			
			let DOMElement = await page.evaluate(() =>{
				return getters.DOM_CHART_NODE();
			});
			
			await saveSingleImage(DOMElement, name, config, logger);
			
			elementData.chartsHTML += createChartHTML(timeRange, `<img src="./${config.assets_dir_name}/${ticker}${timeRange}.jpg">`);
			
		} else {
			
			//logger(`📸 Cloning SVG for ${ticker} -> ${timeRange}...`);
			
			elementData = await page.evaluate(( elementData ) =>{
				
				elementData.chartsHTMLTmp += getters.SVG_DOM_CHART_CLONE();
				return elementData;
				
			}, elementData);
			
			elementData.chartsHTML += createChartHTML(timeRange, elementData.chartsHTMLTmp);
			elementData.chartsHTMLTmp = '';
			
		}
		
	}
	
	function createChartHTML( timeRange, chartHTML ){
		
		let chartTemplate = fs.readFileSync('./templates/chart-template.html', 'utf8');
		chartTemplate     = chartTemplate.replace('{{{timeRange}}}', timeRangeToDisplayValue(timeRange));
		return chartTemplate.replace('{{{chart}}}', chartHTML);
		
	}
	
	return elementData;
	
}

async function gatherData( elementData, page, ticker, config, logger ){
	
	//logger(`🤖 Gathering data for ${ticker}...`);
	
	await page.goto(YF_ENDPOINT, {
		waitUntil : 'load',
		timeout   : 0
	});
	
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

async function convertToHTMLOutput( page, data, config ){
	
	let tickerTemplate = fs.readFileSync('./templates/ticker-template.html', 'utf8');
	tickerTemplate     = replacePlaceholders(tickerTemplate, data);
	
	let infoTemplate = fs.readFileSync('./templates/info-template.html', 'utf8');
	tickerTemplate   = tickerTemplate.replace('{{{info}}}', replacePlaceholders(infoTemplate, data));
	
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

function copyAssets( config, logger ){
	
	logger(`📦 Copying assets files...`);
	
	const from = './templates/';
	const to   = config.save_to_dir + config.assets_dir_name + '/';
	
	[ 'styles.css', 'reset.css', 'favicon.ico' ].forEach(file =>{
		
		fs.copyFileSync(from + file, to + file);
		
	});
	
}

function createFinalHTMLPage( HTML, config, logger ){
	
	logger(`📦 Creating final HTML page...`);
	
	let finalPage = fs.readFileSync('./templates/base.html', 'utf8');
	
	finalPage = finalPage.replace(/{{{assets_dir}}}/g, config.assets_dir_name);
	finalPage = finalPage.replace('{{{data}}}', HTML);
	
	fs.writeFileSync(config.save_to_dir + config.file_name, finalPage);
	
}

async function navigateToStatistics( page ){
	
	const navigationPromise = page.waitForNavigation({
		waitUntil : 'load',
		timeout   : 0
	});
	await page.evaluate(() =>{
		
		$('a:contains("Statistics")')[ 0 ].click();
		
	});
	await navigationPromise;
	
	await prepareTraversal(page);
	await exposeGetters(page);
	
}

async function prepareYahoo( page ){
	
	await page.goto(YF_ENDPOINT, {
		waitUntil : 'load',
		timeout   : 0
	});
	
	const navigationPromise = page.waitForNavigation();
	await page.evaluate(() =>{
		document.querySelector('input.btn').click();
	});
	await navigationPromise;
	
}

async function navigateToTicker( page, ticker, mode ){
	
	await exposeGetters(page);
	
	const navigationPromise = page.waitForNavigation({
		waitUntil : 'load',
		timeout   : 0
	});
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

async function finalize( HTMLDataArray, config, logger ){
	
	logger(`👍️ All tickers have been processed!`);
	
	let HTML = HTMLDataArray.reduce(function( acc, item ){
		return acc + item;
	}, "");
	
	copyAssets(config, logger);
	createFinalHTMLPage(HTML, config, logger);
	
}

async function process( config, browser, logger ){
	
	deleteOldFiles(config, logger);
	createAssetsDirectory(config);
	
	const pool          = await createPagePool(config, browser, logger);
	const pool_sentinel = [];
	
	let currentIndex  = 0;
	let HTMLDataArray = [];
	
	await prepareYahoo(pool[ 0 ]);
	
	for ( let [ index, worker ] of pool.entries() ) {
		
		pool_sentinel.push(processSingleTicker(worker, ++index));
		
	}
	
	return Promise.all(pool_sentinel).then(async function(){
		return await finalize(HTMLDataArray, config, logger);
	});
	
	function processSingleTicker( page, workerID ){
		
		return new Promise(async function( resolve, reject ){
			
			const tickers = config.tickers;
			const index   = currentIndex;
			currentIndex++;
			
			if ( index >= tickers.length ) {
				page.close();
				logger(`🤖 [worker#${workerID}]: no tickers left, unloading!`);
				return resolve();
			}
			
			const ticker = tickers[ index ];
			
			logger(`🤖 [worker#${workerID}]: processing ticker "${ticker[ 0 ]}"...`);
			
			let data = await gatherCharts(page, ticker[ 0 ], config, logger);
			data     = await gatherData(data, page, ticker[ 1 ], config, logger).catch(err => logger(`🔥 An error occurred on Ticker "${ticker[ 1 ]}": ` + err));
			
			HTMLDataArray[ index ] = await convertToHTMLOutput(page, data, config);
			
			return resolve(processSingleTicker(page, workerID));
			
		});
		
	}
	
}

async function execute( config, logger ){
	
	logger('⚡️ Starting...');
	
	const browser = await puppeteer.launch({
		args    : [ '--lang=en-GB' ],
		timeout : 0, //headless : false
	});
	
	await process(config, browser, logger).then(() =>{
		logger('🌈 Task completed!');
	}).catch(( err ) =>{
		logger('🔥 An error occurred: ' + err);
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