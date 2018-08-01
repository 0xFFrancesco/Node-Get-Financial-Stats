//
//IMPORTS
//
const fs        = require('fs-extra');
const puppeteer = require('puppeteer');

const prepareTraversal = require('./nodes-traversal').prepare;
const exposeGetters    = require('./nodes-traversal').exposeGetters;

const ENDPOINT   = "https://www.google.com/search?stick=H4sIAAAAAAAAAOPQeMSozC3w8sc9YSmpSWtOXmMU4RJyy8xLzEtO9UnMS8nMSw9ITE_lAQCCiJIYKAAAAA&q=finance&tbm=fin";
const TIMERANGES = [ '1Y', '5Y', '40Y' ];

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

async function gatherData( page, ticker, config, logger ){
	
	let elementData = {ticker};
	
	//logger(`🤖 Gathering data for ${ticker}...`);
	
	elementData = await page.evaluate(( elementData ) =>{
		
		elementData.p_e                = getters.P_E();
		elementData.price              = getters.PRICE();
		elementData.full_name          = getters.FULL_NAME();
		elementData.cap                = getters.CAP();
		elementData.div_yeld           = getters.DIV_YELD();
		elementData.y_fluctuantion_val = getters.Y_FLUCTUANTION_VAL();
		elementData.y_fluctuantion_per = getters.Y_FLUCTUANTION_PER();
		elementData.eps                = getters.EPS();
		elementData.eps_y_diff         = getters.EPS_Y_DIFF();
		elementData.revenue            = getters.REVENUE();
		elementData.revenue_y_diff     = getters.REVENUE_Y_DIFF();
		elementData.net_income         = getters.NET_INCOME();
		elementData.net_income_y_diff  = getters.NET_INCOME_Y_DIFF();
		elementData.net_prof           = getters.NET_PROF_MARGIN();
		elementData.net_prof_y_diff    = getters.NET_PROF_MARGIN_Y_DIFF();
		
		return elementData;
		
	}, elementData);
	
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
	
	return elementData;
	
	function createChartHTML( timeRange, chartHTML ){
		
		let chartTemplate = fs.readFileSync('./templates/chart-template.html', 'utf8');
		chartTemplate     = chartTemplate.replace('{{{timeRange}}}', timeRangeToDisplayValue(timeRange));
		return chartTemplate.replace('{{{chart}}}', chartHTML);
		
	}
	
}

function createInfoHTML( data ){
	
	let infoTemplate = fs.readFileSync('./templates/info-template.html', 'utf8');
	
	infoTemplate = infoTemplate.replace('{{{price}}}', data.price);
	infoTemplate = infoTemplate.replace('{{{eps}}}', data.eps !== '-' ? data.eps + '$' : data.eps);
	infoTemplate = infoTemplate.replace('{{{p_e}}}', data.p_e);
	infoTemplate = infoTemplate.replace('{{{eps_diff}}}', data.eps_y_diff);
	infoTemplate = infoTemplate.replace('{{{dividends}}}', data.div_yeld);
	infoTemplate = infoTemplate.replace('{{{cap}}}', data.cap);
	infoTemplate = infoTemplate.replace('{{{y_flu}}}', data.y_fluctuantion_val);
	infoTemplate = infoTemplate.replace('{{{y_flu_perc}}}', data.y_fluctuantion_per);
	infoTemplate = infoTemplate.replace('{{{y_rev}}}', data.revenue);
	infoTemplate = infoTemplate.replace('{{{y_rev_perc}}}', data.revenue_y_diff);
	infoTemplate = infoTemplate.replace('{{{y_inc}}}', data.net_income);
	infoTemplate = infoTemplate.replace('{{{y_inc_perc}}}', data.net_income_y_diff);
	infoTemplate = infoTemplate.replace('{{{y_prof}}}', data.net_prof);
	infoTemplate = infoTemplate.replace('{{{y_prof_perc}}}', data.net_prof_y_diff);
	
	return infoTemplate;
	
}

async function convertToHTMLOutput( page, data, config, logger ){
	
	//logger(`🤖 Creating HTML for ${data.ticker}...`);
	
	let tickerTemplate = fs.readFileSync('./templates/ticker-template.html', 'utf8');
	let tickerBadge    = fs.readFileSync('./templates/ticker-badge.html', 'utf8');
	
	const p_eData = config.p_e_ratio_warnings_strategy(data.p_e);
	
	tickerTemplate = tickerTemplate.replace('{{{ticker-name}}}', data.ticker);
	tickerTemplate = tickerTemplate.replace('{{{ticker-full-name}}}', data.full_name);
	
	if ( data.p_e !== '-' ) {
		tickerBadge    = tickerBadge.replace(/{{{pe-color}}}/g, p_eData.color);
		tickerBadge    = tickerBadge.replace('{{{pe-label}}}', p_eData.label);
		tickerBadge    = tickerBadge.replace('{{{pe-value}}}', data.p_e);
		tickerTemplate = tickerTemplate.replace('{{{ticker-badge}}}', tickerBadge);
	} else {
		tickerTemplate = tickerTemplate.replace('{{{ticker-badge}}}', '');
	}
	
	tickerTemplate = tickerTemplate.replace('{{{charts}}}', data.chartsHTML);
	tickerTemplate = tickerTemplate.replace('{{{info}}}', createInfoHTML(data));
	
	return tickerTemplate;
	
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

async function navigateToTicker( page, ticker, config ){
	
	const navigationPromise = page.waitForNavigation();
	await exposeGetters(page);
	
	await page.evaluate(( ticker ) =>{
		
		const input = getters.GET_SEARCH_FIELD();
		const form  = getters.GET_SEARCH_FORM();
		
		input.value = ticker;
		form.submit();
		
	}, ticker);
	
	await navigationPromise;
	await prepareTraversal(page, config);
	await exposeGetters(page);
	
}

async function createPagePool( config, browser, logger ){
	
	const pool = [];
	let page;
	
	logger(`🤖 Creating a pool of ${config.pool_size} concurrent workers...`);
	
	for ( let i = 0; i < config.pool_size; i++ ) {
		
		page = await browser.newPage();
		await page.goto(ENDPOINT, {waitUntil : 'load'});
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
	
	const page = await browser.newPage();
	await page.goto(ENDPOINT, {waitUntil : 'load'});
	
	deleteOldFiles(config, logger);
	createAssetsDirectory(config);
	
	const pool          = await createPagePool(config, browser, logger);
	const pool_sentinel = [];
	
	let currentIndex  = 0;
	let HTMLDataArray = [];
	
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
			
			logger(`🤖 [worker#${workerID}]: processing ticker "${ticker}"...`);
			
			await navigateToTicker(page, ticker, config);
			let data = await gatherData(page, ticker, config, logger);
			HTMLDataArray[ index ] = await convertToHTMLOutput(page, data, config, logger);
			
			return resolve(processSingleTicker(page, workerID));
			
		});
		
	}
	
}

async function execute( config, logger ){
	
	logger('⚡️ Starting...');
	
	const browser = await puppeteer.launch({args : [ '--lang=en-GB' ]});
	
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