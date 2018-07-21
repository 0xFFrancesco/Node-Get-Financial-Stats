module.exports = {
	
	//
	//MUST EDIT
	//
	save_to_dir : 'INSERT HERE THE PATH TO SAVE THE GENERATED DATA',
	tickers     : [ 'APPL', /* 'TICKER2', 'TICKER3' */ ],
	
	//
	//OPTIONAL
	//
	injectJqueryWaitTime : 2000,
	ajaxChartWaitTime    : 2000,
	assets_dir_name      : 'financial_stats_assets',
	file_name            : 'financial_stats.html',
	use_images           : false, //whether to use images instead of cloning SVGs nodes [EXPERIMENTAL]
	
	p_e_ratio_warnings_strategy : function( p_e ){
		
		switch ( true ) {
			case (p_e < 10):
				return {
					label : "probably under evaluated",
					color : "#06a20b"
				};
			case (p_e < 30):
				return {
					label : "probably safe",
					color : "#64a306"
				};
			case (p_e < 50):
				return {
					label : "pay attention",
					color : "#9da206"
				};
			case (p_e < 75):
				return {
					label : "pay high attention",
					color : "#a18006"
				};
			default:
				return {
					label : "probably over evaluated",
					color : "#a04105"
				};
		}
	}
};