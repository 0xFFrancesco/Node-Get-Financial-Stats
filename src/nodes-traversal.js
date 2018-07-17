async function injectJQuery( page ){
	
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
	
	await page.waitFor(2500);
	
}

async function exposeGetters( page ){
	
	await page.evaluate(() =>{
		
		window.toNumber = function toNumber( string ){
			
			if ( string === '-' ) {
				return 0;
			}
			
			string = typeof string === "string" ? string : string + '';
			return +(+(string.replace(',', '.'))).toFixed(2);
		};
		
		window.readInnerText = function readInnerText( $obj ){
			
			return $obj[ 0 ] ? $obj[ 0 ].innerText : '-';
			
		};
		
		window.getters = {
			
			//
			//RETURN VALUES
			//
			P_E                    : () => toNumber(readInnerText($("td:contains('P/E ratio')").next())),
			PRICE                  : () => toNumber(readInnerText($("span:contains('USD')").prev())),
			FULL_NAME              : () => readInnerText($('[role="heading"] > div').next()),
			CAP                    : () => readInnerText($("td:contains('Mkt cap')").next()),
			DIV_YELD               : () => readInnerText($("td:contains('Div yield')").next()),
			Y_FLUCTUANTION_VAL     : () => toNumber(toNumber(readInnerText($("td:contains('52-wk high')").next())) - toNumber(readInnerText($("td:contains('52-wk low')").next()))),
			Y_FLUCTUANTION_PER     : () => toNumber(100 - toNumber(readInnerText($("td:contains('52-wk low')").next())) / toNumber(readInnerText($("td:contains('52-wk high')").next())) * 100),
			EPS                    : () => readInnerText($("td:contains('Diluted EPS')").next()),
			EPS_Y_DIFF             : () => readInnerText($("td:contains('Diluted EPS')").next().next()),
			REVENUE                : () => readInnerText($("td:contains('Revenue')").next()),
			REVENUE_Y_DIFF         : () => readInnerText($("td:contains('Revenue')").next().next()),
			NET_INCOME             : () => readInnerText($("td:contains('Net income')").next()),
			NET_INCOME_Y_DIFF      : () => readInnerText($("td:contains('Net income')").next().next()),
			NET_PROF_MARGIN        : () => readInnerText($("td:contains('Net profit margin')").next()),
			NET_PROF_MARGIN_Y_DIFF : () => readInnerText($("td:contains('Net profit margin')").next().next()),
			
			//
			//RETURN NODES
			//
			GET_TIMERANGE_BTN : ( timeRange ) => $(`div[data-period="${timeRange}"]`)[ 0 ],
			GET_SEARCH_FIELD  : () => document.querySelector('#lst-ib'),
			GET_SEARCH_FORM   : () => document.querySelector('[name="f"]'),
			GET_SEARCH_SUBMIT : () => $('[name="btnG"]')[ 0 ],
			
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
	prepare : async page => await injectJQuery(page),
	exposeGetters
};