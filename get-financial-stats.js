//
//IMPORTS
//
const fs        = require('fs');
const puppeteer = require('puppeteer');

//
//FUNCTIONS
//
async function saveSingleImage( element, imageName, config, logger ){
	
	const imageFullPath = config.save_to_dir + imageName + '.jpg';
	logger(`Saving file: ${imageFullPath}...`);
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
	
	const timeRanges = [ '1Y',/* '5Y', '40Y' */];
	
	await takeDOMElementImage(config.summary_selector, ticker + 'summary');
	
	for ( let timeRange of timeRanges ) {
		
		await changeTimeRange(page, timeRange);
		await takeDOMElementImage(config.chart_selector, ticker + timeRange);
		
	}
	
	async function takeDOMElementImage( selector, name ){
		let DOMElement = await page.$(selector);
		await saveSingleImage(DOMElement, name, config, logger);
	}
	
}

async function combineTickerImages( ticker, logger ){
	
	logger(`Combining ${ticker} images...`);
	
}

async function combineAllImagesToFinal( logger ){
	
	logger(`Creating final image...`);
	
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
	
	for ( let ticker of config.tickers ) {
		
		logger(`Processing ${ticker}...`);
		
		await navigateToTicker(page, ticker, config);
		await takeImages(page, ticker, config, logger);
		await combineTickerImages(ticker, logger);
		
	}
	
	await combineAllImagesToFinal(logger);
	
}

async function execute( config, logger ){
	
	logger('Starting...');
	
	const browser = await puppeteer.launch({headless : false});
	
	await process(config, browser, logger).then(() =>{
		logger('Task completed!');
	}).catch(( err ) =>{
		logger('An error occurred: ' + err);
	});
	
	logger('Unloading resources...');
	await browser.close();
	logger('Finished!');
	
}

//
//EXPORTS
//
module.exports = {execute};