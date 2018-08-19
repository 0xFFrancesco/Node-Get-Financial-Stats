module.exports = {
	
	//
	//MUST EDIT
	//
	save_to_dir : 'INSERT HERE THE PATH TO SAVE THE GENERATED DATA',
	tickers     : [ [ 'APPL', 'APPL' ], [ 'GOOG', 'GOOG' ], [ 'JNJ', 'JNJ' ], /* ['TICKER4_Google', 'TICKER4_Yahoo'], ... */ ],
	
	//
	//OPTIONAL
	//
	injectJqueryWaitTime : 2500,
	ajaxChartWaitTime    : 2500,
	assets_dir_name      : 'financial_stats_assets',
	file_name            : 'financial_stats.html',
	use_images           : false, 	//whether to use images instead of cloning SVGs nodes [EXPERIMENTAL]
	pool_size            : 6,		//number of concurrent workers
	
	strategy_fn : function( TickerHTML, TickerOBJ ){
		
		//Return the manipulated HTML to display.
		return TickerHTML;
		
	}
};