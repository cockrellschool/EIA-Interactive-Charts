
/* Should this go in html? */
// json object to 
//var DATA_FREQ = "M";	// Currently support A - annual, M - monthly.


// -----------------------  DO NOT EDIT BELOW ----------------------------------

var API_KEY = "0FB373836A1B16D4B0700CCCEC3C1845";
//var dataUrl = "http://api.eia.gov/series/?api_key="+API_KEY+"&series_id="+SERIES_ID;
var dataUrl = "http://api.eia.gov/series/?api_key="+API_KEY+"&series_id=";

var CHART_GRID_AXIS_WIDTH = 1;
var CHART_GRID_AXIS_COLOR = "black";
var CHART_GRID_LINE_WIDTH = 0.25;
var CHART_GRID_LINE_COLOR = "black";

var CHART_GRID_FONT_STYLE = '12px Helvetica, Arial';
var CHART_GRID_FONT_COLOR = "#555";

var CHART_REFNODE_RADIUS = 5;
var CHART_REFNODE_COLOR = "#813600";

var CHART_REFDG_WIDTH = 200; 
var CHART_REFDG_HEIGHT = 38;
var CHART_REFDG_CORNER = 2;
var CHART_REFDG_STROKE_WIDTH = .3;
var CHART_REFDG_STROKE = "black";
var CHART_REFDG_FILL = "white";
var CHART_REFDG_FILL_OP = 0.95;
var CHART_REFDG_OFFX = 10;
var CHART_REFDG_OFFY = -20;

var CHART_REFDG_FONT_STYLE = 'Helvetica, Arial';
var CHART_REFDG_FONT_SIZE = "14px";
var CHART_REFDG_FONT_COLOR = "#666";
var CHART_REFDG_TIME_FONT_STYLE = 'Helvetica, Arial';
var CHART_REFDG_TIME_FONT_COLOR = "#333";
var CHART_REFDG_DATA_FONT_STYLE = 'Helvetica, Arial';
var CHART_REFDG_DATA_FONT_COLOR = "#d35e13";
// var CHART_REFDG_UNIT_FONT_STYLE = '10px Helvetica, Arial';
// var CHART_REFDG_UNIT_FONT_COLOR = "black";

var CHART_TITLE_FONT_STYLE = 'Helvetica, Arial';
var CHART_TITLE_FONT_COLOR = "Black";
var CHART_TITLE_FONT_SIZE = "16px";
var CHART_UNIT_FONT_STYLE = '8px Helvetica, Arial';
var CHART_UNIT_FONT_COLOR = "grey";

var CHART_LINE_WIDTH = 3;
var CHART_LINE_COLOR = "#d35e13";

var CHART_FREQ = "M";
var CHART_START_YEAR = 1900; 
var CHART_START_MONTH = 1;
var CHART_END_YEAR = new Date().getFullYear();
var CHART_END_MONTH = 12;

var CHART_ROW_COUNT = Y_VALUE_LIST.length-1;
var CHART_ROW_HEIGHT = Math.floor(CHART_INNER_HEIGHT/CHART_ROW_COUNT);
var CHART_COL_COUNT = CHART_END_YEAR-CHART_START_YEAR;
var CHART_COL_WIDTH = Math.floor(CHART_INNER_WIDTH/CHART_COL_COUNT);

var CHART_TITLE = "Title";
var CHART_UNIT = "unit";
var CHART_DESCRIPTION = "description";
var CHART_SOURCE = "source";
var CHART_UPDATED = "last updated";

(function ($) {
$(document).ready(function() {
	var refLine = null, refNode = null, refDialog = null, refBound = null;
	var dataSetList = new Array(), dataList = new Array();

	// create canvas
	var r = Raphael(document.getElementById("canvas"), CHART_WIDTH, CHART_HEIGHT);	

	// create via the first data
	var xhr = new XMLHttpRequest();
	var firstUrl = dataUrl + DATASET[0].SID;
	xhr.open('GET', firstUrl, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // collect data
            var response = JSON.parse(xhr.response);

			CHART_FREQ = response["series"][0]["f"];	// M=month(201402), Q=Quater(2014Q1), A=Anual(2014)
			var chartStart = response["series"][0]["start"];
			var chartEnd = response["series"][0]["end"];
			if(CHART_FREQ=="M") {
				CHART_START_YEAR = Math.round(Number(chartStart.substr(0,4)));
				CHART_START_MONTH = Math.round(Number(chartStart.substr(4,2)));
				CHART_END_YEAR = Math.round(Number(chartEnd.substr(0,4)));
				CHART_END_MONTH = Math.round(Number(chartEnd.substr(4,2)));

				CHART_COL_COUNT = (CHART_END_YEAR-CHART_START_YEAR)*12+CHART_END_MONTH-1;
				CHART_COL_WIDTH = Math.floor(CHART_INNER_WIDTH/CHART_COL_COUNT);
			} else {
				CHART_START_YEAR = Math.round(Number(chartStart.substr(0,4)));
				CHART_END_YEAR = Math.round(Number(chartEnd.substr(0,4)));

				CHART_COL_COUNT = CHART_END_YEAR-CHART_START_YEAR;
				CHART_COL_WIDTH = Math.floor(CHART_INNER_WIDTH/CHART_COL_COUNT);
			}

			CHART_INNER_WIDTH = Math.round(CHART_COL_WIDTH*CHART_COL_COUNT);

			CHART_UNIT = response["series"][0]["units"];
			// CHART_TITLE = response["series"][0]["name"];
			// CHART_DESCRIPTION = response["series"][0]["description"];
			// CHART_SOURCE = response["series"][0]["source"];
			// CHART_UPDATED = response["series"][0]["updated"];

			// draw grid
			r.drawGrid();
			// draw reference bounding box
			refBound = r.rect(CHART_PADDING_LEFT, CHART_PADDING_TOP, CHART_INNER_WIDTH, CHART_INNER_HEIGHT)
				.attr({"stroke-width":0, "fill":"yellow", "fill-opacity":0})
				.mouseout(handleChartMouseOut);
			//draw reference node
			refNode = r.circle(CHART_PADDING_LEFT, CHART_PADDING_TOP, CHART_REFNODE_RADIUS)
						.attr({"stroke-width":1,"stroke":"white","fill":CHART_REFNODE_COLOR})
						.hide();
			//draw reference dialog
			refDialog = r.set();	// [0]:rectangle, [1] line 1 title+time, [2] line 2 data		
			refDialog.push(r.rect(0, 0, CHART_REFDG_WIDTH, CHART_REFDG_HEIGHT, CHART_REFDG_CORNER).attr({"stroke-width":CHART_REFDG_STROKE_WIDTH,"stroke":CHART_REFDG_STROKE,"fill":CHART_REFDG_FILL,"fill-opacity":CHART_REFDG_FILL_OP}));
			refDialog.push(r.text(10, 10, "title"+": "+CHART_START_YEAR+"-"+CHART_START_MONTH).attr({"font":CHART_REFDG_FONT_STYLE,"font":CHART_REFDG_FONT_STYLE,"fill":CHART_REFDG_FONT_COLOR,"text-anchor":"start"}));
			refDialog.push(r.text(10, 25, "data").attr({"font":CHART_REFDG_DATA_FONT_STYLE,"font-size":CHART_REFDG_FONT_SIZE,"font-weight":"bold","fill":CHART_REFDG_DATA_FONT_COLOR,"text-anchor":"start"}));
			refDialog.hide();
			// draw dataset title
			r.text(0, 10, DATASET_TITLE).attr({"font":CHART_TITLE_FONT_STYLE, "font-size":CHART_TITLE_FONT_SIZE, "fill":CHART_TITLE_FONT_COLOR, "text-anchor":"start"});

			// get first data
			var chartData = response["series"][0]["data"];
			dataSetList[0] = response["series"][0]["data"];
			r.drawChart(0);
			// get remaining data
			var dataFlagList = new Array();
			dataFlagList[0] = true;
			for(var i=1; i<DATASET.length; i++) {
				dataFlagList[i] = false;
				getMoreData(i);
			}
			function getMoreData(idx) {
				var ixhr = new XMLHttpRequest();
				var iUrl = dataUrl + DATASET[idx].SID;
				ixhr.open('GET', iUrl, true);
				ixhr.onreadystatechange = function() {
					if (ixhr.readyState == 4 && ixhr.status == 200) {
						var iresponse = JSON.parse(ixhr.response);
						dataSetList[idx] = iresponse["series"][0]["data"];

						r.drawChart(idx);
					}
				}
				ixhr.send(); 
			}
        }	// end if status
    }	// end onreadystatechange
	xhr.send(); 		

	Raphael.fn.drawGrid = function() {		
		// x-lines
		var currYear = CHART_START_YEAR;	
		if(CHART_FREQ=="M") {	// monthly
			var step = 1;
			if(CHART_COL_COUNT<=120) {
				step = 1;
			} else if(CHART_COL_COUNT<=240) {
				step = 2;
			} else {
				step = 5;
			}			
			for(var i=0; i<=CHART_COL_COUNT; i=i+12*step) {
				this.path("M "+(CHART_PADDING_LEFT+i*CHART_COL_WIDTH)+" "+(CHART_PADDING_TOP+CHART_INNER_HEIGHT)+" v 10")
					.attr({"stroke-width":CHART_GRID_LINE_WIDTH, "stroke":CHART_GRID_LINE_COLOR});
				this.text((CHART_PADDING_LEFT+i*CHART_COL_WIDTH), (CHART_PADDING_TOP+CHART_INNER_HEIGHT), currYear)
					.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR})
					.transform("T0,20");
				currYear=currYear+step;
			}
		} else {	// annually
			var step = 1;
			if(CHART_COL_COUNT<=10) {
				step = 1;
			} else if(CHART_COL_COUNT<=20) {
				step = 2;
			} else if(CHART_COL_COUNT<=50) {
				step = 5;
			} else {
				step = 10;
			}			
			for(var i=0; i<=CHART_COL_COUNT; i=i+step) {
				this.path("M "+(CHART_PADDING_LEFT+i*CHART_COL_WIDTH)+" "+(CHART_PADDING_TOP+CHART_INNER_HEIGHT)+" v 10")
					.attr({"stroke-width":CHART_GRID_LINE_WIDTH, "stroke":CHART_GRID_LINE_COLOR});
				this.text((CHART_PADDING_LEFT+i*CHART_COL_WIDTH), (CHART_PADDING_TOP+CHART_INNER_HEIGHT), currYear)
					.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR})
					.transform("T0,20");
				currYear=currYear+step;
			}
		}

		// x-axis
		this.path("M "+CHART_PADDING_LEFT+" "+(CHART_PADDING_TOP+CHART_INNER_HEIGHT)+" h "+CHART_INNER_WIDTH)
			.attr({"stroke-width":CHART_GRID_AXIS_WIDTH, "stroke":CHART_GRID_AXIS_COLOR});
		this.text(CHART_PADDING_LEFT, (CHART_PADDING_TOP+CHART_INNER_HEIGHT), numToString(Y_VALUE_LIST[0]))
			.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR, "text-anchor":"end"})
			.transform("T-10,0");
		// y-lines
		for(var i=1; i<=CHART_ROW_COUNT; i++) {
			this.path("M "+CHART_PADDING_LEFT+" "+(CHART_PADDING_TOP+CHART_INNER_HEIGHT-i*CHART_ROW_HEIGHT)+" h "+CHART_INNER_WIDTH)
				.attr({"stroke-width":CHART_GRID_LINE_WIDTH, "stroke":CHART_GRID_LINE_COLOR});
			this.text(CHART_PADDING_LEFT, (CHART_PADDING_TOP+CHART_INNER_HEIGHT-i*CHART_ROW_HEIGHT), numToString(Y_VALUE_LIST[i]))
				.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR, "text-anchor":"end"})
				.transform("T-10,0");
		}
	};	// end drawGrid

	Raphael.fn.drawChart = function(cid) {
		CHART_LINE_COLOR = DATASET[cid].color;
		var pathStr = "";
		// populate dataList (global)
		dataList[cid] = new Array();			
		for(var i=0; i<dataSetList[cid].length; i++) {
			var pt = getCoords(dataSetList[cid][i][0], dataSetList[cid][i][1]);	// time, value
			dataList[cid].push({
				id:i, 
				year:pt.year, 
				month:pt.month, 
				x:pt.x, 
				y:pt.y, 
				xdata:dataSetList[cid][i][0], 
				ydata:dataSetList[cid][i][1]
			});

			if(i==0) {
				pathStr = "M "+pt.x+" "+pt.y+" ";
			} else {
				pathStr = pathStr+"L "+pt.x+" "+pt.y+" ";
			}
		}

		this.path(pathStr)
			.data("cid", cid)
			.attr({"stroke-width":CHART_LINE_WIDTH, "stroke":CHART_LINE_COLOR, "stroke-linejoin":"round",'stroke-linecap': "round"})
			.mouseover(handleChartMouseIn).mousemove(handleChartMouseIn);
    }

	// event handlers
	function handleChartMouseIn(evt) {
		evt.preventDefault();
		evt.stopPropagation();

		var thisDataList = dataList[this.data("cid")];

		var mouseX = evt.clientX-this.node.parentNode.offsetLeft;
		var px = 0, py=0, dataid=0;
		if(mouseX<=CHART_PADDING_LEFT) {
			px = CHART_PADDING_LEFT;
			py = thisDataList[thisDataList.length-1].y;
			dataid = thisDataList.length-1;
		} else if( mouseX>=thisDataList[0].x ){
			px = thisDataList[0].x;
			py = thisDataList[0].y;
			dataid = 0;
		} else {
			for(var i=0; i<thisDataList.length-1; i++) {
				if(thisDataList[i+1].x<=mouseX && mouseX<=thisDataList[i].x) {
					if( (mouseX-thisDataList[i+1].x)<=(thisDataList[i].x-mouseX) ) {
						px = thisDataList[i+1].x;
						py = thisDataList[i+1].y;
						dataid = i+1;
					} else {
						px = thisDataList[i].x;
						py = thisDataList[i].y;
						dataid = i;
					}
				}
			}
		}

		refNode.attr({"cx":px, "cy":py, "fill":DATASET[this.data("cid")].color});
		refNode.toFront().show();

		var dx = px+CHART_REFDG_OFFX;
		var dy = py+CHART_REFDG_OFFY;
		if( (dx+CHART_REFDG_WIDTH)>=(CHART_PADDING_LEFT+CHART_INNER_WIDTH) ) {
			dx = px-CHART_REFDG_OFFX-CHART_REFDG_WIDTH;
		}
		var cmonth = monthToString(thisDataList[dataid].month);
		var cyear = thisDataList[dataid].year;
		var cdata = numToString(thisDataList[dataid].ydata.toFixed(2));
		var cunit = convertUnit(CHART_UNIT);
		if(CHART_FREQ=="M") {
			refDialog[1].attr({"text":(DATASET[this.data("cid")].title+": "+cmonth+" "+cyear)});
		} else {
			refDialog[1].attr({"text":(DATASET[this.data("cid")].title+": "+cyear)});
		}
		refDialog[2].attr({"text":(cdata+" "+cunit), "fill":DATASET[this.data("cid")].color});
		refDialog.transform("T"+dx+","+dy);
		refDialog.toFront().show();
	}
	function handleChartMouseOut(evt) {
		evt.preventDefault();
		evt.stopPropagation();		
		
		// refLine.hide();
		refNode.hide();
		refDialog.hide();
	}

	// helper functions
	function getCoords(xval, yval) {
		var currYear = Math.round(Number(xval.substr(0,4)));
		var xCoord = 0;
		if(CHART_FREQ=="M") {
			var currMonth = Math.round(Number(xval.substr(4,2)));
			xCoord = Math.round( ((currYear-CHART_START_YEAR)*12+currMonth-1)*CHART_COL_WIDTH+CHART_PADDING_LEFT );
		} else {
			xCoord = Math.round( (currYear-CHART_START_YEAR)*CHART_COL_WIDTH+CHART_PADDING_LEFT );
		}

		var yCoord = Math.round( CHART_PADDING_TOP+CHART_INNER_HEIGHT*(1-(yval-Y_VALUE_LIST[0])/(Y_VALUE_LIST[Y_VALUE_LIST.length-1]-Y_VALUE_LIST[0])) );

		return {year:currYear, month:currMonth, x:xCoord, y:yCoord};
	};

	function numToString(x) {
		if(x>=1000) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} else {
			return x.toString();
		}
	};

	function monthToString(int) {
		var monthArr = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
		return monthArr[int-1];
	};

	function convertUnit(unit) {
		var newUnit = "";
		switch(unit){
			case 'thousand megawatthours':
			newUnit = "thousand MWh"
			break;
			default:
			break;
		}

		return newUnit;
	};

});	// end $(document).ready
}(jQuery));