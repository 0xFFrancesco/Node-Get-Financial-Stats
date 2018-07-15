//
//IMPORTS
//
const fs        = require('fs-extra');
const puppeteer = require('puppeteer');

const timeRanges = [ '1Y', '5Y', '40Y' ];
let output       = "";

//
//FUNCTIONS
//
async function saveSingleImage( element, imageName, config, logger ){
	
	const dest          = config.save_to_dir + config.assets_dir_name + '/';
	const imageFullPath = dest + imageName + '.jpg';
	
	logger(`📸 Saving file: ${imageFullPath}...`);
	
	if ( !fs.existsSync(dest) ) {
		fs.mkdirSync(dest);
	}
	
	return await element.screenshot({path : imageFullPath});
	
}

async function changeTimeRange( page, timeRange ){
	
	await page.evaluate(( timeRange ) =>{
		
		const button = document.querySelector(`div[data-period="${timeRange}"]`);
		button.click();
		
	}, timeRange);
	
	await page.waitFor(2000);
	
}

async function takeImages( page, ticker, config, logger ){
	
	await takeDOMElementImage(config.summary_selector, ticker + 'summary');
	await takeDOMElementImage(config.financial_selector, ticker + 'financial');
	
	for ( let timeRange of timeRanges ) {
		
		await changeTimeRange(page, timeRange);
		await takeDOMElementImage(config.chart_selector, ticker + timeRange);
		
	}
	
	async function takeDOMElementImage( selector, name ){
		let DOMElement = await page.$(selector);
		await saveSingleImage(DOMElement, name, config, logger);
	}
	
}

async function convertToHTMLOutput( page, ticker, config, logger ){
	
	logger(`🤖 Creating HTML for ${ticker}...`);
	
	let tickerTemplate = fs.readFileSync('./templates/ticker-template.html', 'utf8');
	
	const tickerFullName = await extractFieldValue(page, 'div[role="heading"] > div:nth-child(2)');
	const pe             = parseFloat(await extractFieldValue(page, config.summary_selector + ' table tr:nth-child(5) td:nth-child(2)'));
	
	const peData = config.p_e_ratio_warnings_strategy(pe);
	
	tickerTemplate = tickerTemplate.replace('{{{ticker-name}}}', ticker);
	tickerTemplate = tickerTemplate.replace('{{{ticker-full-name}}}', tickerFullName);
	
	tickerTemplate = tickerTemplate.replace(/{{{pe-color}}}/g, peData.color);
	tickerTemplate = tickerTemplate.replace('{{{pe-label}}}', peData.label);
	
	let historyHTML = "";
	let image;
	
	timeRanges.forEach(timeRange =>{
		
		image = `<div class="col-xs-12 col-lg-4"><div class="ticker-time-range">${timeRangeToDisplayValue(timeRange)}</div><img src="./${config.assets_dir_name}/${ticker}${timeRange}.jpg"></div>`;
		historyHTML += image;
		
	});
	
	tickerTemplate = tickerTemplate.replace('{{{ticker-price-images}}}', historyHTML);
	
	image          = `<div class="col-xs-12 col-lg-6"><img src="./${config.assets_dir_name}/${ticker}financial.jpg"></div>`;
	tickerTemplate = tickerTemplate.replace('{{{ticker-financial}}}', image);
	
	image          = `<div class="col-xs-12 col-lg-6"><img src="./${config.assets_dir_name}/${ticker}summary.jpg"></div>`;
	tickerTemplate = tickerTemplate.replace('{{{ticker-summary}}}', image);
	
	output += tickerTemplate;
	
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

async function extractFieldValue( page, selector ){
	
	return await page.evaluate(( selector ) =>{
		
		const DOMElement = document.querySelector(selector);
		return DOMElement.innerText;
		
	}, selector);
	
}

function deleteOldFiles( config, logger ){
	
	logger(`🌀 Removing old files...`);
	fs.removeSync(config.save_to_dir + config.file_name);
	fs.removeSync(config.save_to_dir + config.assets_dir_name);
	
}

function copyAssets( config, logger ){
	
	logger(`🤖 Copying assets files...`);
	
	const from = './templates/';
	const to   = config.save_to_dir + config.assets_dir_name + '/';
	
	[ 'styles.css', 'reset.css', 'grid.css', 'favicon.ico' ].forEach(file =>{
		
		fs.copyFileSync(from + file, to + file);
		
	});
	
}

function createFinalHTMLPage( config, logger ){
	
	logger(`🤖 Creating final HTML page...`);
	
	let finalPage = fs.readFileSync('./templates/base.html', 'utf8');
	
	finalPage = finalPage.replace(/{{{assets_dir}}}/g, config.assets_dir_name);
	finalPage = finalPage.replace('{{{data}}}', output);
	
	fs.writeFileSync(config.save_to_dir + config.file_name, finalPage);
	
}

async function navigateToTicker( page, ticker, config ){
	
	const navigationPromise = page.waitForNavigation();
	
	await page.evaluate(( ticker, config ) =>{
		
		const input = document.querySelector(config.search_field_selector);
		const form  = document.querySelector(config.search_form_selector);
		
		input.value = ticker;
		form.submit();
		
	}, ticker, config);
	
	await navigationPromise;
	
}

async function process( config, browser, logger ){
	
	const page = await browser.newPage();
	await page.goto(config.endpoint, {waitUntil : 'load'});
	
	deleteOldFiles(config, logger);
	
	for ( let ticker of config.tickers ) {
		
		logger(`🤖 Processing ${ticker}...`);
		
		await navigateToTicker(page, ticker, config);
		await takeImages(page, ticker, config, logger);
		await convertToHTMLOutput(page, ticker, config, logger);
		
	}
	
	copyAssets(config, logger);
	createFinalHTMLPage(config, logger);
	
}

async function execute( config, logger ){
	
	logger('⚡️ Starting...');
	
	const browser = await puppeteer.launch();
	
	await process(config, browser, logger).then(() =>{
		logger('🌈 Task completed!');
	}).catch(( err ) =>{
		logger('🔥 An error occurred: ' + err);
		logger('🌀 Removing files...');
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