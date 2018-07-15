module.exports = {
	
	//
	//MUST EDIT
	//
	save_to_dir : 'path to save the image to',
	tickers     : [ 'ticker 1', 'ticker 2', 'ticker n' ],
	
	//
	//OPTIONAL
	//
	assets_dir_name        : 'node_get_financial_stats_assets',
	endpoint               : "https://www.google.com/search?stick=H4sIAAAAAAAAAOPQeMSozC3w8sc9YSmpSWtOXmMU4RJyy8xLzEtO9UnMS8nMSw9ITE_lAQCCiJIYKAAAAA&q=finance&tbm=fin",
	search_field_selector  : '#lst-ib',
	search_form_selector   : '[name="f"]',
	search_submit_selector : '[name="btnG"]',
	chart_selector         : '#knowledge-finance-wholepage__entity-summary > div > div > g-card-section',
	summary_selector       : '#knowledge-finance-wholepage__entity-summary > div > div > g-card-section:nth-child(2)',
	financial_selector     : '.knowledge-finance-wholepage__section div.mod',
	
	p_e_ratio_warnings_strategy : function( p_e ){
		
		switch ( 1 ) {
			case p_e < 5:
				return {
					label : "bargain",
					color : "#06a20b"
				};
			case p_e < 25:
				return {
					label : "safe",
					color : "#64a306"
				};
			case p_e < 40:
				return {
					label : "pay attention",
					color : "#9da206"
				};
			case p_e < 60:
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