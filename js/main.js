var API_KEY = "0FB373836A1B16D4B0700CCCEC3C1845";
var SERIES_ID = "ELEC.GEN.ALL-US-99.M";
//var dataUrl = "http://api.eia.gov/series?api_key="+API_KEY+"&series_id="+SERIES_ID;
var dataUrl = "http://api.eia.gov/series/?api_key="+API_KEY+"&series_id="+SERIES_ID;

var Y_VALUE_LIST = [0, 100000, 200000, 300000, 400000, 500000];

var mult = .5;

var CHART_WIDTH = 1200 * mult;
var CHART_HEIGHT = 600 * mult;

var CHART_PADDING_LEFT = 60;
var CHART_PADDING_RIGHT = 20 * mult;
var CHART_PADDING_TOP = 60 * mult;
var CHART_PADDING_BOTTOM = 30 * mult;

// caculate carefully!!!
var CHART_INNER_WIDTH = 1000 * mult;
var CHART_INNER_HEIGHT = 510 * mult;

var CHART_GRID_AXIS_WIDTH = 1;
var CHART_GRID_AXIS_COLOR = "black";
var CHART_GRID_LINE_WIDTH = 0.25;
var CHART_GRID_LINE_COLOR = "black";

var CHART_GRID_FONT_STYLE = '12px Helvetica, Arial';
var CHART_GRID_FONT_COLOR = "black";

var CHART_REFLINE_WIDTH = 1;
var CHART_REFLINE_COLOR = "gray";
var CHART_REFNODE_RADIUS = 5;
var CHART_REFNODE_COLOR = "#813600";

var CHART_REFDG_WIDTH = 150;
var CHART_REFDG_HEIGHT = 50;
var CHART_REFDG_CORNER = 2;
var CHART_REFDG_STROKE_WIDTH = .25;
var CHART_REFDG_STROKE = "black";
var CHART_REFDG_FILL = "white";
var CHART_REFDG_FILL_OP = 0.95;
var CHART_REFDG_OFFX = 10;
var CHART_REFDG_OFFY = -20;

var CHART_REFDG_FONT_STYLE = '10px Helvetica, Arial';
var CHART_REFDG_FONT_COLOR = "black";
var CHART_REFDG_TIME_FONT_STYLE = '10px Helvetica, Arial';
var CHART_REFDG_TIME_FONT_COLOR = "black";
var CHART_REFDG_DATA_FONT_STYLE = '10px Helvetica, Arial';
var CHART_REFDG_DATA_FONT_COLOR = "black";
var CHART_REFDG_UNIT_FONT_STYLE = '10px Helvetica, Arial';
var CHART_REFDG_UNIT_FONT_COLOR = "black";

var CHART_TITLE_FONT_STYLE = '20px Helvetica, Arial';
var CHART_TITLE_FONT_COLOR = "Black";
var CHART_UNIT_FONT_STYLE = '10px Helvetica, Arial';
var CHART_UNIT_FONT_COLOR = "grey";

var CHART_LINE_WIDTH = 4;
var CHART_LINE_COLOR = "#d35e13";

var CHART_FREQ = "M";
var CHART_START_YEAR = 2001;  // Needs to be dynamically read
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
	var dataList = new Array();
	// create canvas
	var r = Raphael(document.getElementById("canvas"), CHART_WIDTH, CHART_HEIGHT);	

	// create connection
	var xhr = new XMLHttpRequest();
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
			}

			CHART_TITLE = response["series"][0]["name"];
			CHART_UNIT = response["series"][0]["units"];
			CHART_UNIT = fixUnits(CHART_UNIT);
			CHART_DESCRIPTION = response["series"][0]["description"];
			CHART_SOURCE = response["series"][0]["source"];
			CHART_UPDATED = response["series"][0]["updated"];

			var chartData = response["series"][0]["data"];

			// process data list
			for(var i=0; i<chartData.length; i++) {
				var pCoords = getCoords(chartData[i][0], chartData[i][1]);
				chartData[i][1] = Math.round(chartData[i][1]*100)/100; // round to 2 decimals
				chartData[i][1] = commaSeparateNumber(chartData[i][1]); // comma separate
				console.log(convertToMonth(pCoords.month));
				pCoords.month = convertToMonth(pCoords.month);
				dataList.push({id:i, year:pCoords.year, month:pCoords.month, x:pCoords.x, y:pCoords.y, xdata:chartData[i][0], ydata:chartData[i][1]});
			}

			// draw title and units
			r.text(0, 10, CHART_TITLE).attr({"font":CHART_TITLE_FONT_STYLE, "fill":CHART_TITLE_FONT_COLOR, "text-anchor":"start"});
			//r.text(0, 40, CHART_UNIT).attr({"font":CHART_UNIT_FONT_STYLE, "fill":CHART_UNIT_FONT_COLOR, "text-anchor":"start"});

			// draw chart
			r.drawGrid();
			r.drawChart(dataList);

			//draw reference line
			refLine = r.path("M "+CHART_PADDING_LEFT+" "+CHART_PADDING_TOP+" v "+CHART_INNER_HEIGHT)
						.attr({"stroke-width":CHART_REFLINE_WIDTH, "stroke":CHART_REFLINE_COLOR})
						.hide();
			//draw reference node
			refNode = r.circle(dataList[dataList.length-1].x, dataList[dataList.length-1].y, CHART_REFNODE_RADIUS)
						.attr({"stroke-width":0,"fill":CHART_REFNODE_COLOR})
						.hide();
			//draw reference dialog
			refDialog = r.set();	// [0]:rectangle, [1] line 1, [2] line 2, [3] line 3
			refDialog.push(r.rect(0, 0, CHART_REFDG_WIDTH, CHART_REFDG_HEIGHT, CHART_REFDG_CORNER)
							.attr({"stroke-width":CHART_REFDG_STROKE_WIDTH,"stroke":CHART_REFDG_STROKE,"fill":CHART_REFDG_FILL,"fill-opacity":CHART_REFDG_FILL_OP}));
			refDialog.push(r.text(10, 10, CHART_START_YEAR+"-"+CHART_START_MONTH)
							.attr({"font":CHART_REFDG_FONT_STYLE,"fill":CHART_REFDG_FONT_COLOR,"text-anchor":"start"}));
			refDialog.push(r.text(10, 25, "data")
							.attr({"font":CHART_REFDG_DATA_FONT_STYLE,"fill":CHART_REFDG_DATA_FONT_COLOR,"text-anchor":"start"}));
			refDialog.push(r.text(10, 40, CHART_UNIT)
							.attr({"font":CHART_REFDG_FONT_STYLE,"fill":CHART_REFDG_FONT_COLOR,"text-anchor":"start"}));
			refDialog.hide();

			// draw bounding box for mouse event listener
			refBound = r.rect(CHART_PADDING_LEFT, CHART_PADDING_TOP, CHART_INNER_WIDTH, CHART_INNER_HEIGHT)
				.attr({"stroke-width":0, "fill":"yellow", "fill-opacity":0})
				.hover(handleChartMouseIn, handleChartMouseOut)
				.mousemove(handleChartMouseMove);

        }
    }
	xhr.open('GET', dataUrl, true);
	xhr.send(); 		

	Raphael.fn.drawGrid = function() {
		// x-lines
		if(CHART_FREQ=="M") {
			var currYear = CHART_START_YEAR;
			for(var i=0; i<=CHART_COL_COUNT; i=i+12) {
				this.path("M "+(CHART_PADDING_LEFT+i*CHART_COL_WIDTH)+" "+(CHART_HEIGHT-CHART_PADDING_BOTTOM)+" v 10")
					.attr({"stroke-width":CHART_GRID_LINE_WIDTH, "stroke":CHART_GRID_LINE_COLOR});
				this.text((CHART_PADDING_LEFT+i*CHART_COL_WIDTH), (CHART_HEIGHT-CHART_PADDING_BOTTOM), currYear)
					.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR})
					.transform("T0,20");
				currYear++;
			}
		}
		// x-axis
		this.path("M "+CHART_PADDING_LEFT+" "+(CHART_HEIGHT-CHART_PADDING_BOTTOM)+" h "+CHART_INNER_WIDTH)
			.attr({"stroke-width":CHART_GRID_AXIS_WIDTH, "stroke":CHART_GRID_AXIS_COLOR});
		this.text(CHART_PADDING_LEFT, (CHART_HEIGHT-CHART_PADDING_BOTTOM), numToString(Y_VALUE_LIST[0]))
			.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR, "text-anchor":"end"})
			.transform("T-10,0");
		// y-lines
		for(var i=1; i<=CHART_ROW_COUNT; i++) {
			this.path("M "+CHART_PADDING_LEFT+" "+(CHART_HEIGHT-CHART_PADDING_BOTTOM-i*CHART_ROW_HEIGHT)+" h "+CHART_INNER_WIDTH)
				.attr({"stroke-width":CHART_GRID_LINE_WIDTH, "stroke":CHART_GRID_LINE_COLOR});
			this.text(CHART_PADDING_LEFT, (CHART_HEIGHT-CHART_PADDING_BOTTOM-i*CHART_ROW_HEIGHT), numToString(Y_VALUE_LIST[i]))
				.attr({"font":CHART_GRID_FONT_STYLE, "fill":CHART_GRID_FONT_COLOR, "text-anchor":"end"})
				.transform("T-10,0");
		}
	};	// end drawGrid

	Raphael.fn.drawChart = function() {
		var pathStr = "M "+dataList[0].x+" "+dataList[0].y+" ";
    	for(var i=1; i<dataList.length; i++) {
    		//this.circle(dataList[j].x, dataList[j].y, CHART_NODE_RADIUS).attr({"stroke":CHART_NODE_COLOR, "fill":CHART_NODE_COLOR});
    		pathStr = pathStr+"L "+dataList[i].x+" "+dataList[i].y+" ";
    	}
    	this.path(pathStr)
    		.attr({"stroke-width":CHART_LINE_WIDTH, "stroke":CHART_LINE_COLOR, "stroke-linejoin":"miter",'stroke-linecap': "round"});
    }

	// event handlers
	function handleChartMouseIn(evt) {
		evt.preventDefault();
		evt.stopPropagation();

		refLine.show();
		refNode.show();
		refDialog.show();

	}
	function handleChartMouseOut(evt) {
		evt.preventDefault();
		evt.stopPropagation();		
		
		refLine.hide();
		refNode.hide();
		refDialog.hide();
	}
	function handleChartMouseMove(evt) {
		evt.preventDefault();
		evt.stopPropagation();

		var mouseX = evt.clientX-this.node.parentNode.offsetLeft;
		var px = 0, py=0, dataid=0;
		if(mouseX<=CHART_PADDING_LEFT) {
			px = CHART_PADDING_LEFT;
			py = dataList[dataList.length-1].y;
			dataid = dataList.length-1;
		} else if( mouseX>=dataList[0].x ){
			px = dataList[0].x;
			py = dataList[0].y;
			dataid = 0;
		} else {
			for(var i=0; i<dataList.length-1; i++) {
				if(dataList[i+1].x<=mouseX && mouseX<=dataList[i].x) {
					if( (mouseX-dataList[i+1].x)<=(dataList[i].x-mouseX) ) {
						px = dataList[i+1].x;
						py = dataList[i+1].y;
						dataid = i+1;
					} else {
						px = dataList[i].x;
						py = dataList[i].y;
						dataid = i;
					}
				}
			}
		}

		var refPath = "M "+px+" "+CHART_PADDING_TOP+" v "+CHART_INNER_HEIGHT;
		refLine.attr({"path": refPath});

		refNode.attr({"cx":px, "cy":py});

		var dx = px+CHART_REFDG_OFFX;
		var dy = py+CHART_REFDG_OFFY;
		if( (dx+CHART_REFDG_WIDTH)>=(CHART_PADDING_LEFT+CHART_INNER_WIDTH) ) {
			dx = px-CHART_REFDG_OFFX-CHART_REFDG_WIDTH;
		}
		refDialog[1].attr({"text":(dataList[dataid].month+" "+dataList[dataid].year)});
		refDialog[2].attr({"text":dataList[dataid].ydata});
		refDialog.transform("T"+dx+","+dy);
	}

	// helper functions
	function getCoords(xval, yval) {
		var currYear = 0, currMonth=0;
		var xCoord = 0;
		if(CHART_FREQ=="M") {
			var currYear = Math.round(Number(xval.substr(0,4)));
			var currMonth = Math.round(Number(xval.substr(4,2)));
			var currCol = (currYear-CHART_START_YEAR)*12+currMonth-1;
			xCoord = Math.round( ((currYear-CHART_START_YEAR)*12+currMonth-1)*CHART_COL_WIDTH+CHART_PADDING_LEFT );
		}

		var yCoord = Math.round( CHART_HEIGHT-(yval-Y_VALUE_LIST[0])*CHART_INNER_HEIGHT/(Y_VALUE_LIST[Y_VALUE_LIST.length-1]-Y_VALUE_LIST[0])-CHART_PADDING_BOTTOM );

		return {year:currYear, month:currMonth, x:xCoord, y:yCoord};
	}

	function numToString(x) {
		if(x>=1000) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		} else {
			return x.toString();
		}
	};

	function commaSeparateNumber(val){
	    while (/(\d+)(\d{3})/.test(val)){
	      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
	    }
	    return val;
	}

	function commaSeparateNumber(val){
	    while (/(\d+)(\d{3})/.test(val)){
	      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
	    }
	    return val;
	}

	function convertToMonth(int) {
		var monthArr = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

		return monthArr[int-1];
	}

	function fixUnits(unit) {

		var newUnit = "";

		switch(unit){
			case 'thousand megawatthours':
			newUnit = "1000 MWh"
			break;
			default:
			break;
		}

		return newUnit;
	}



});	// end $(document).ready
}(jQuery));