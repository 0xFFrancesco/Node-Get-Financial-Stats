async function injectJQuery( page, config ){
	
	await page.evaluate(() =>{
		
		function l( u, i ){
			var d = document;
			if ( !d.getElementById(i) ) {
				var s = d.createElement('script');
				s.src = u;
				s.id  = i;
				d.body.appendChild(s);
			}
		}
		
		l('//code.jquery.com/jquery-3.2.1.min.js', 'jquery');
		
	});
	
	await page.waitFor(config.injectJqueryWaitTime);
	
}

async function exposeGetters( page ){
	
	await page.evaluate(() =>{
		
		window.readInnerText = function readInnerText( $obj ){
			
			return $obj[ 0 ] ? $obj[ 0 ].innerText : '-';
			
		};
		
		window.getTableData = ( contains ) => readInnerText($('span:contains("' + contains + '")').parents('td').next().last());
		
		window.getters = {
			
			//YAHOO FINANCE
			YF_GET_SEARCH_FIELD : () => document.querySelector('#fin-srch-assist input'),
			YF_GET_SEARCH_FORM  : () => document.querySelector('#uh-search form'),
			CURRENCY            : () =>{
				const currency = readInnerText($('#Main div:contains("Currency in")').last()).split(' ').slice(-1)[ 0 ];
				return currency === "USD" ? "$" : (currency === "EUR" ? "€" : currency);
			},
			
			NAME          : () => readInnerText($('h1')).split('(')[ 0 ],
			PRICE         : () => readInnerText($('div#quote-market-notice').prev().prev()),
			TR_PE         : () => getTableData("Trailing P/E"),
			FW_PE         : () => getTableData("Forward P/E"),
			P_BOOK        : () => getTableData("Price/Book"),
			PROF_MARGIN   : () => getTableData("Profit Margin"),
			RET_ON_ASSETS : () => getTableData("Return on Assets"),
			RET_ON_EQUITY : () => getTableData("Return on Equity"),
			REVENUE       : () => getTableData("Revenue"),
			G_PROFIT      : () => getTableData("Gross Profit"),
			NET_INCOME    : () => getTableData("Net Income Avi to Common"),
			EPS           : () => getTableData("Diluted EP"),
			DEBT          : () => getTableData("Total Debt"),
			DEBT_EQUITY   : () => getTableData("Total Debt/Equity"),
			CURR_RATIO    : () => getTableData("Current Ratio"),
			BOOK_PS       : () => getTableData("Book Value Per Share"),
			BETA          : () => getTableData("Beta"),
			W52_H         : () => getTableData("52 Week High"),
			W52_L         : () => getTableData("52 Week Low"),
			W52_C         : () => getTableData("52-Week Change"),
			AVG_VOL       : () => getTableData("Avg Vol (3 month)"),
			SHORT_RATIO   : () => getTableData("Short Ratio"),
			SHORTED       : () => getTableData("Short % of Shares"),
			PAYOUT_RATIO  : () => getTableData("Payout Ratio"),
			DIV_YIELD     : () => getTableData("Trailing Annual Dividend Yield"),
			CAP           : () => getTableData("Market Cap"),
			
			
			//GOOGLE FINANCE
			GET_TIMERANGE_BTN   : ( timeRange ) => $(`div[data-period="${timeRange}"]`)[ 0 ],
			GF_GET_SEARCH_FIELD : () => document.querySelector('#lst-ib'),
			GF_GET_SEARCH_FORM  : () => document.querySelector('[name="f"]'),
			
			SVG_DOM_CHART_CLONE : () =>{
				$('.knowledge-finance-wholepage-chart__fw-hdot.knowledge-finance-wholepage-chart__fw-hdot-cu').remove();
				return $('[data-async-type="finance_wholepage_chart"]')[ 0 ].outerHTML;
			},
			
			DOM_CHART_NODE : () =>{
				return $('[data-async-type="finance_wholepage_chart"]')[ 0 ];
			}
			
		};
		
	});
	
}

module.exports = {
	prepare : async ( page, config ) => await injectJQuery(page, config),
	exposeGetters
};