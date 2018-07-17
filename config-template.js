module.exports = {
	
	//
	//MUST EDIT
	//
	save_to_dir : 'path to generate data',
	tickers     : [ 'APPL', /* 'TICKER2', 'TICKER3' */ ],
	
	//
	//OPTIONAL
	//
	assets_dir_name : 'financial_stats_assets',
	file_name       : 'financial_stats.html',
	use_images      : false, //whether to use images instead of cloning SVGs nodes
	
	p_e_ratio_warnings_strategy : function( p_e ){
		
		switch ( true ) {
			case (p_e < 5):
				return {
					label : "bargain",
					color : "#06a20b"
				};
			case (p_e < 25):
				return {
					label : "safe",
					color : "#64a306"
				};
			case (p_e < 40):
				return {
					label : "pay attention",
					color : "#9da206"
				};
			case (p_e < 60):
				return {
					label : "probably over evaluated",
					color : "#a18006"
				};
			default:
				return {
					label : "probably a bubble",
					color : "#a04105"
				};
		}
	}
};