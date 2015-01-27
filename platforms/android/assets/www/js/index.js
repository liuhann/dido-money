/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var ocdb = null;
var icdb = null;
var typedb = null;

var app = {
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
    	$(document).ready(function() {
    		ready();
    	});
    }
};
app.initialize();

function ready() {
	$("html").css("font-size", Math.floor($(window).height()/40) + "px");
	
	ocdb = new TAFFY();
	ocdb.store("ocdb");
	icdb = new TAFFY();
	icdb.store("icdb");
	typedb = new TAFFY();
	typedb.store("typedb");
	
	if(typedb().count()==0) {
		typedb.insert({type: "日常饮食"});
		typedb.insert({type: "衣装鞋帽"});
		typedb.insert({type: "交通通讯"});
		typedb.insert({type: "休闲娱乐"});
		typedb.insert({type: "人情往来"});
		typedb.insert({type: "固定大件"});
		typedb.insert({type: "房租水电"});
		typedb.insert({type: "意外支出"});
	}
	
	$(".dashboard .addoc").attach(function() {
		pageOcEdit(null);
	});
	$(".dashboard .addic").attach(function() {
		pageIcEdit(null);
	});
	
	$(".dashboard .cftype").attach(function() {
		pageOcTypeConfig();
	});
	
	$(".dashboard .big").attach(function() {
		pageBigger();
	});
	$(".dashboard .chart").attach(function() {
		pageCompare();
	});
	
	$(".dashboard .back2sd").attach(function() {
		backUp();
	});
	$(".dashboard .jd").attach(function() {
		importJD();
	});
		
	$(".bottom .nvcfg").attach(function() {
		pageConfig();
	});
	
	$(".bottom .nvlist").attach(function() {
		pageList();
	});
	
	$(".bottom .nvdb").attach(function() {
		pageDashboard();
	});
	$(".bottom .nvchart").attach(function() {
		pageChart();
	});
	
	$(".page .return, .page .close").attach(function() {
		$(".page").hide();
	});
	
	
	$("input.date").attach(function(t) {
		datePicker.show({
			  date: new Date($(t).val()),
			  mode: 'date'
			} , function(date){
				$(t).val(date.format("yyyy-mm-dd"));
		});
	});
	
	pageDashboard();
}

function clear() {
	$(".main .wrapper").hide();
	$(".main .header .title").html("叮咚记账");
	$(".main .header .icon").hide();
}


function pageDashboard() {
	clear();
	$(".main .dashboard").show();
	$(".main .bottom .nvdb").addClass("sibon");
	initDashBoardChart();
	initTotalSum();
}

function initTotalSum() {
	
	var prem = getPreMonthStart();
	var curm = getNextMonthStart();
	
	var premTotal = 0;
	var curmTotal = 0;
	
	ocdb({"date": {">": prem.getTime(),"<": curm.getTime()}}).each(function(record, number) {
		if (new Date(record.date).getMonth()==prem.getMonth()) {
			premTotal += record.total;
		} else {
			curmTotal += record.total;
		}
	});

	$(".dashboard .summary .lastm").html(premTotal);
	$(".dashboard .summary .currentm").html(curmTotal);
	
	var currentAver = Math.floor(curmTotal/new Date().getDate());
	var preAver = Math.floor(premTotal/30);
	$(".dashboard .summary .currentaver").html(currentAver);
	
	if (preAver>0) {
		var percents =  Math.floor(100 * (currentAver-preAver)/preAver);
		
		if (percents>0) {
			$(".dashboard .summary .per").html("+" + percents + "%");
			$(".dashboard .summary .per").css("color", "#FF3600");
		} else {
			$(".dashboard .summary .per").html(percents + "%");
			$(".dashboard .summary .per").css("color", "#00B800");
		}
	}
	
}

function initDashBoardChart() {
	
	$("#dashchart").css("height", $("#chart30").height());
	$("#dashchart").css("width", $("#chart30").width()*3);
	
	var barData = getChartData();
	
	drawBar(barData, getChartXData(), "#dashchart", "#yaxis");
	
	var mscroll = new IScroll('#chart30', { scrollX: true, scrollY: false});
	mscroll.scrollTo(-parseInt($("#chart30").width()) * 1.9, 0, 3000);
}

function getChartXData() {
	var d = new Date();
	var from = new Date(d.getTime() -24*24*60*60*1000);
	var to = new Date(d.getTime() + 3*24*60*60*1000);
	
	var xdata = [];
	while(from.getTime()<to.getTime()) {
		xdata.push(from.format("m-d"));
		from = new Date(from.getTime() + 24*60*60*1000);
	}
	return xdata;
}

function getChartData() {
	var d = new Date();
	var from = new Date(d.getTime() -24*24*60*60*1000);
	var to = new Date(d.getTime() + 3*24*60*60*1000);

	var barLast = {};
	var barData = [];
	ocdb({"date": {">": from.getTime(),"<": to.getTime()}}).each(function(record, number) {
		var o = {
				x : new Date(record.date).format("m-d"),
				l : record.total,
				c : "red"
			};
		
			if (barLast[new Date(record.date).format("m-d")]==null) {
				o.s = o.l;
			} else {
				o.s = barLast[new Date(record.date).format("m-d")].s + o.l;
			}
			barLast[new Date(record.date).format("m-d")] = o;
			barData.push(o);
	});
	return barData;
}

function pageOcEdit(oc) {
	$(".edit-oc").show();
	
	$(".edit-oc .type option").remove();
	typedb().each(function(record) {
		$(".edit-oc .type").append("<option>" + record.type + "</option>");
	});
	
	$(".edit-oc table.oclist tr").remove();
	if (oc!=null) {
		$(".edit-oc").data("ocid", oc.___id);
		$('.edit-oc .total').val(oc.total)
		$('.edit-oc .desc').val(oc.title);
		$(".edit-oc .date").val(new Date(oc.date).format("isoDate"));
		
		$('.edit-oc .by').val(oc.by);
		$('.edit-oc .type').val(oc.type);
		
		for ( var i = 0; i < oc.items.length; i++) {
			addToDetailList(oc.items[i]);
		}
		$(".edit-oc .header a.remove").show();
		
		$(".edit-oc .header a.remove").attach(function() {
			navigator.notification.confirm(
					'删除后无法恢复，是否继续',
					function(idx) {
						if (idx==1) {
							var ocid= $(".edit-oc").data("ocid");
							if (ocid) {
								ocdb(ocid).remove();
								editClose();
							}
						}
					}, 
					'删除确认',
					['继续删除','取消']
			);
		});
	} else {
		$(".edit-oc").data("ocid", null);
		$('.edit-oc .total').val("")
		$('.edit-oc .desc').val("");
		$(".edit-oc .date").val(new Date().format("yyyy-mm-dd"));
		$(".edit-oc .header a.remove").hide();
	}
	
	$(".btn.add-detail").attach(function() {
		$(".edit-oc .detail").show();
		
		$(".edit-oc .detail .add").attach(function() {
			var o = {
				price: $(".edit-oc .detail .price").val(),
				name: $(".edit-oc .detail .name").val()
			};
			addToDetailList(o);
			$(".edit-oc .detail .price").val(0);
			$(".edit-oc .detail .name").val("");
		});
		
		$(".edit-oc .detail .close").attach(function() {
			$(".edit-oc .detail").hide();
		})
	});
	
	$(".edit-oc .yes").attach(function() {
		saveOc();
	});
	
	function addToDetailList(o) {
		var tr = $('<tr><td class="name"></td><td class="price"></td><td class="remove">删除</td></tr>');
		tr.find("td.name").html(o.name);
		tr.find("td.price").html(o.price);
		tr.find("td.remove").attach(function(t) {
			$(t).parents("tr").remove();
		});
		$(".edit-oc table.oclist").append(tr);
	}
}

function saveOc() {
	var oc = {};
	if (!isPrice($('.edit-oc .total').val())) {
		showAlert("支出金额必须为正数");
		return;
	}
	
	oc.total = getFloatFormat(parseFloat($('.edit-oc .total').val()));
	oc.type = "oc";
	oc.updated = new Date().getTime();
	oc.title = $('.edit-oc .desc').val();
	
	oc.date = new Date($(".edit-oc .date").val()).getTime();
	
	oc.by = $('.edit-oc .by').val();
	oc.type = $('.edit-oc .type').val();
	
	oc.items = [];
	
	$('.edit-oc table.oclist tr').each(function() {
		oc.items.push({
			name: $(this).find("td.name").html(),
			price: getFloatFormat(parseFloat($(this).find("td.price").html()))
		});
	});

	var ocid= $(".edit-oc").data("ocid");
	if (ocid) {
		ocdb(ocid).update(oc);
	} else {
		ocdb.insert(oc);
	}
	editClose();
}

function pageIcEdit(ic) {
	if (ic) {
		$('.edit-ic .desc').val(ic.title);
		$('.edit-ic .total').val(ic.total);
		$(".edit-ic .date").val(new Date(ic.date).format("yyyy-mm-dd"));
		$('.edit-ic .type').val(ic.type);
		$(".edit-ic").data("icid", ic.___id);
		
		$(".edit-ic .header a.remove").show();
		
		$(".edit-ic .header a.remove").attach(function() {
			navigator.notification.confirm(
					'删除后无法恢复，是否继续',
					function(idx) {
						if (idx==1) {
							var icid= $(".edit-ic").data("icid");
							if (icid) {
								icdb(icid).remove();
								editClose();
							}
						}
					}, 
					'删除确认',
					['继续删除','取消']
			);
		});
	} else {
		$(".edit-ic .header a.remove").hide();
		$('.edit-ic .desc').val("");
		$('.edit-ic .total').val("");
		$(".edit-ic .date").val(new Date().format("yyyy-mm-dd"));
		$(".edit-ic").data("icid", null);
	}
	
	$(".edit-ic").show();
	$(".edit-ic .yes").attach(function() {
		saveIc();
	});
}

function saveIc() {
	var ic = {}
	if (!isPrice($('.edit-ic .total').val())) {
		showAlert("支出金额必须为正数");
		return;
	}
	
	ic.title = $('.edit-ic .desc').val();
	ic.total = getFloatFormat(parseFloat($('.edit-ic .total').val()));
	ic.date = new Date($(".edit-ic .date").val()).getTime();
	ic.type = $('.edit-ic .type').val();
	
	var icid= $(".edit-ic").data("icid");
	if (icid) {
		icdb(icid).update(ic);
	} else {
		icdb.insert(ic);
	}
	editClose();
}

function editClose() {
	$(".edit-ic").hide();
	$(".edit-oc").hide();
	
	if ($(".main .wrapper.list:visible").length==1) {
		monthList();
	} else {
		initTotalSum();
		setTimeout(function() {
			updateBar(getChartData(), getChartXData(), "#dashchart");
		}, 500);
	}
}

var ccscroll = null;
function pageList() {
	$(".main .wrapper").hide();
	
	$(".main .list").show();
	monthList(new Date());
	
	$(".main .header a.list-next-m").show().attach(function() {
		var d = $(".main .list").data("date");
		monthList(getNextMonthStart(d));
	});
	
	$(".main .header a.list-prev-m").show().attach(function() {
		var d = $(".main .list").data("date");
		monthList(getPreMonthStart(d));
	});
}

function monthList(d) {
	if (d==null) {
		d = $(".main .list").data("date");
	}
	$(".main .header .title").html(d.format("yyyy年m月"));
	
	$(".main .list").data("date", d);
	var totalic = 0;
	var totaloc = 0;
	
	$(".ccentry,.cctitle").remove();
	
	ocdb({"date": {">": getMonthStart(d).getTime(),"<": getNextMonthStart(d).getTime()}}).order("date desc").each(function(record, number) {
		addItemToScrollList(record, "oc");
		totaloc += parseFloat(record.total);
	});
	
	icdb({"date": {">": getMonthStart(d).getTime(),"<": getNextMonthStart(d).getTime()}}).each(function(record, number) {
		addItemToScrollList(record, "ic");
		totalic += parseFloat(record.total);
	});
	
	$(".main .list .month .oc").html(totaloc);
	$(".main .list .month .ic").html(totalic);
	
	if (ccscroll==null) {
		var ccscroll = new IScroll('#ccscroll');
	} else {
		setTimeout(function () {
			ccscroll.refresh();
	    }, 200);
	}
}

function addItemToScrollList(o,type, ul) {
	var li = $("ul.cclist li.item.template").clone();
	li.removeClass("template");
	li.addClass("ccentry");
	li.data(type, o);
	
	var dateid = getDateId(o.date);
	var titleli = $("#" + dateid);
	
	if (titleli.length>0) {
		titleli.data(type, titleli.data(type) + o.total);
	} else {
		titleli = $("ul.cclist li.title.template").clone();
		titleli.removeClass("template");
		titleli.addClass("cctitle");
		titleli.data(type, o.total);
		titleli.attr("id",dateid);
		titleli.find(".date").html(new Date(o.date).format("m月d日"));
		if (ul==null) {
			$("ul.cclist").append(titleli);
		} else {
			$(ul).append(titleli);
		}
	}
	
	var ocic = "";
	if (titleli.data("oc")) {
		ocic = "支出" + titleli.data("oc");
	}
	if (titleli.data("ic")) {
		ocic = " 收入" + titleli.data("ic");
	}
	titleli.find("i").html(ocic);
	
	
	li.find(".desc").html(o.title + 
			((o.items && o.items.length>0)?(o.items[0].name + "等" + o.items.length + "项"):""));
	if (o.by) {
		li.find(".method").html(o.by);
	}
	li.find(".cat").html(o.type);
	li.find(".total").html(o.total).addClass(type);
	
	if (type=="oc") {
		li.attach(function(t) {
			pageOcEdit($(t).data("oc"));
		});
	} else {
		li.attach(function(t) {
			pageIcEdit($(t).data("ic"));
		});
	}
	
	titleli.after(li);
}

function pageConfig() {
	$(".main .wrapper").hide();
	
	$(".main .config").show();
	
	$(".main .config .entry.oc-type").attach(function() {
		pageOcTypeConfig();
	});
	
	$(".main .config .entry.sd-recover").attach(function() {
		pageRecover();
	});
	
	$(".main .config .entry.sd-backup").attach(function() {
		backUp();
	});
	
	$(".main .config .entry.bigger-type i.value").html(getConfig("bigger", 100));
	
	$(".main .config .entry.bigger-type").attach(function() {
		navigator.notification.prompt(
			    '请输入大笔支出的最低金额',  // message
			    function(results) {
			    	if (results.buttonIndex==1 && ""!=results.input1) {
			    		if (isPrice(results.input1)) {
			    			setConfig("bigger", results.input1);
			    			$(".main .config .entry.bigger-type i.value").html(getConfig("bigger", 100));
			    		} else {
			    			showAlert("输入必须为正数");
			    		}
			    	}
			    },                  // callback to invoke
			    '大额支出',            // title
			    ['确认','取消'],             // buttonLabels
			    ""   				// defaultText
		);
	});
}

var typecfgscroll = null;
function pageOcTypeConfig() {
	$(".oc-types").show();
	$("ul.type-list-edit li").remove();
	
	typedb().each(function(record) {
		addTypeLi(record.type);
	});
	
	$(".oc-types a.add").attach(function() {
		navigator.notification.prompt(
		    '请输入新的分类名称',  // message
		    function(results) {
		    	if (results.buttonIndex==1 && ""!=results.input1) {
		    		typedb.insert({type: results.input1});
		    		addTypeLi(results.input1);
		    	}
		    },                  // callback to invoke
		    '新的分类',            // title
		    ['确认','取消'],             // buttonLabels
		    ''   				// defaultText
		);
	});
	
	if (typecfgscroll==null) {
		var typecfgscroll = new IScroll('#typecfg-wrapper');
	} else {
		setTimeout(function () {
			typecfgscroll.refresh();
	    }, 200);
	}
	
	
	function addTypeLi(type) {
		var li = $("<li class='entry'><div class='title'></div><i class='remove'></i></li>");
		li.find(".title").html(type);
		
		li.find("i.remove").attach(function(t) {
			navigator.notification.confirm(
					'删除后无法恢复，是否继续',
					function(idx) {
						if (idx==1) {
							var type = $(t).parents("li.entry").find(".title").html();
							typedb({"type": type}).remove();
							$(t).parents("li.entry").remove();
							setTimeout(function () {
								typecfgscroll.refresh();
						    }, 200);
						}
					}, 
					'删除确认',
					['继续删除','取消']
			);
		});
		$("ul.type-list-edit").append(li);
		
	}
}

function importJD() {
	var ref = window.open('https://passport.m.jd.com/user/login.action', '_blank', 'location=yes');
	
	ref.addEventListener("loadstop", function(event) {
		if (event.url.indexOf("home.action")>-1) {
			var sid = event.url.substring(event.url.indexOf("sid=")+4);
			readJdPage(sid, 1);
			//ref.executeScript({code: "location.href=''"});
		}
	});
}

function readJdPage(sid, page) {
	$.post("https://passport.m.jd.com/user/userAllOrderList.json", {
		"sid":sid,
		"page":page
	}, function(data) {
		for(var i=0; i<data.orders.length; i++) {
			try {
				var order = data.orders[i];
				var oc = {};
				oc.total = getFloatFormat(parseFloat(order.price));
				oc.type = "oc";
				oc.updated = new Date().getTime();
				oc.title = order.orderMsg.wareInfoList[0].wname;
				oc.type = "其他";
				oc.date = new Date(order.dataSubmit).getTime();
				oc.by = "网购";
				oc.orderid = order.orderId;
				oc.items = [];
				
				for(var m=0;m<order.orderMsg.wareInfoList.length; m++) {
					var inf = order.orderMsg.wareInfoList[m];
					oc.items.push(
							{
								name: inf.wname,
								price: 0
							}
					);
				}
				
				if (ocdb({orderid: oc.orderid}).count()==0) {
					ocdb.insert(oc);
				}
				
			} catch (err) {
				showAlert("error:" + err.name + "  "  + err.message);
			}
		}
		showAlert("已处理最近" + data.orders.length + "条记录");
	});
	
}

function pageChart() {
	clear();
	$(".wrapper.chart").show();
	$("#chstart").val(getMonthStart(new Date()).format("yyyy-mm-dd"));
	$("#chstop").val(new Date().format("yyyy-mm-dd"));
	
	
	$("#ch-btn-cfm").attach(function() {
		//将时间设置为包括from和to的天数
		var from = new Date($("#chstart").val());
		from = new Date(from.getTime()-24*60*60*1000);
		from.setHours(23,59,59);
		var to = new Date($("#chstop").val());
		to.setHours(23,50,0);
		
		if (from.getTime()>to.getTime()) {
			showAlert("开始时间不能大于结束时间");
			return;
		}
		$("#chsummary").show();
		
		var bycat = {
		};
		
		var total = 0;
		var bigger = 0;
		
		ocdb({"date": {">": from.getTime(),"<": to.getTime()}}).order("date desc").each(function(record, number) {
			if (bycat[record.type] ==null) {
				bycat[record.type] = record.total;
			} else {
				bycat[record.type] += record.total;
			}
			total +=record.total;
			if (record.total > parseInt(getConfig("bigger", 100))){
				bigger ++;
			}
		});
		
		$("#chsummary .total span").html(total);  //总计
		
		$("#chsummary li.type").remove();
		
		for ( var type in bycat) {
			var li = $("<li class='info type'><i></i><span></span></li>");
			li.find("i").html(type);
			li.find("span").html(bycat[type] + "元");
			$("#chsummary .total").after(li);
		}
		
		var dateLength = Math.floor((to.getTime()-from.getTime())/(24*60*60*1000));
		if (dateLength==0) dateLength=1;
		$("#chsummary .aver span").html(Math.floor(total/dateLength) + "元"); //平均
		$("#chsummary .vari span").html(bigger + "笔");
		
		var originalData = [];
		var donutData = [];
		for ( var type in bycat) {
			var cc = randomColor()
			donutData.push({
				value: bycat[type],
				color: cc,
				label: type
			});
			originalData.push({
				value: 20,
				color: cc,
				label: type
			});
			
		}
		d3.select("#catpie").select("svg").remove();
		
		var w = $("#catpie").width();
		var h = $(".main .chart").height();
		var space = 40;
		
		var svg = d3.select("#catpie").append("svg").attr("width",w).attr("height",w);
	    svg.append("g").attr("id","salesDonut");
	    
	    Donut3D.draw("salesDonut", originalData, w/2, w/2, w/2-space, w/2-space, 20, 0.4);
	    if (donutData.length>1) {
	    	Donut3D.transition("salesDonut", donutData, w/2-space, w/2-space, 20, 0.4);
	    }
	    var mscroll = new IScroll('#chsummary');
	});
}

function pageBigger() {
	
	$(".page.big-ocs").show();
	$(".ccentry,.cctitle").remove();
	
	ocdb({total: {">": parseInt(getConfig("bigger", 100))}}).order("date desc").each(function(record) {
		addItemToScrollList(record, "oc", "#big-wrapper ul");
	});
	
	var scroll = new IScroll("#big-wrapper");
}

function pageCompare() {
	$(".page.oi-compare").show();
	
	var totals = {};
	
	$(".oi-compare table.compare .cloned").remove();
	
	ocdb().each(function(record) {
		var month = new Date(record.date).format("yyyy-mm");
		if (totals[month]==null) {
			totals[month] = {
				oc: record.total,
				ic: 0
			}
		} else {
			totals[month].oc += record.total;
		}
	});
	
	icdb().each(function(record) {
		var month = new Date(record.date).format("yyyy-mm");
		if (totals[month]==null) {
			totals[month] = {
				oc: 0,
				ic: record.total
			}
		} else {
			totals[month].ic += record.total;
		}
	});
	
	var max = 0;
	for ( var month in totals) {
		if (totals[month].oc>max) max = totals[month].oc; 
		if (totals[month].ic>max) max = totals[month].ic;
	}
	var cw = parseInt($(".oi-compare table tr.template td.chart").css("width"));
	
	for ( var month in totals) {
		
		var d = new Date(month);
		
		var cloned = $(".oi-compare table.compare tr.template").clone();
		cloned.removeClass("template").addClass("cloned");
		
		cloned.find(".yy").html(d.getFullYear());
		cloned.find(".mm").html(d.getMonth()+1);
		
		cloned.find(".data .oc").html("支出:￥" + totals[month].oc);
		cloned.find(".data .ic").html("收入:￥" + totals[month].ic);
		var dec = (totals[month].ic - totals[month].oc);
		if (dec>0) {
			cloned.find(".data .dec").html( "收支差:+" + dec).addClass("ic");
		} else {
			cloned.find(".data .dec").html( "收支差:" + dec).addClass("oc");
		}
		$(".oi-compare table.compare").append(cloned);
		cloned.find(".chart .oc").css("width", 0);
		cloned.find(".chart .oc").css("width", (totals[month].oc/max) * 100 + "%");
		cloned.find(".chart .ic").css("width", (totals[month].ic/max) * 100 + "%");
	}
}

function pageRecover() {
	$(".data-recover").show();
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getDirectory("backup", {create: true, exclusive: false}, 
			function(dirEntry) {
				var directoryReader = dirEntry.createReader();
				directoryReader.readEntries(function(entries) {
		            $("#backup-list ul li").remove();
		            for (var i=0; i<entries.length; i++) {
		            	entries[i].file(gotFile, ffail);
		            }
		        }, ffail);
				
			}, ffail);
	}, ffail);
}

function gotFile(file) {
	readAsText(file);
}

function readAsText(file) {
    var reader = new FileReader();
    reader.onloadend = function(evt) {
        var str = evt.target.result;
        if (str.length>0) {
        	var li = $("<li class='d'><div class='title'>"
    				+ file.name + "</div><div class='desc'></div></li>");
        	var o = JSON.parse(str);
        	
    		li.find(".desc").html(o.oc.length + "条支出记录，" + o.ic.length + "收入记录");
    		
    		li.data("o", o);
    		
    		li.attach(function(t) {
				navigator.notification.confirm(
					'还原将删除现有记录',
					function(idx) {
						if (idx==1) {
							var o = $(t).data("o");
							doRecover(o);
						}
					}, 
					'数据还原',
					['继续','取消']
				);
    		});
    		
    		$("#backup-list ul").append(li);
        }
    };
    reader.readAsText(file);
}

function doRecover(o) {
	ocdb().remove();
	for ( var i = 0; i < o.oc.length; i++) {
		var oci = o.oc[i];
		delete oci.___id;
		delete oci.___s;
		ocdb.insert(oci);
	}
	icdb().remove();
	for ( var i = 0; i < o.ic.length; i++) {
		var ici = o.ic[i];
		delete ici.___id;
		delete ici.___s;
		icdb.insert(ici);
	}
	typedb().remove();
	for ( var i = 0; i < o.type.length; i++) {
		var typei = o.type[i];
		delete typei.___id;
		delete typei.___s;
		typedb.insert(typei);
	}
	showAlert("数据已经还原");
	$(".data-recover").hide();
}

function backUp() {
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
		fileSystem.root.getDirectory("backup", {create: true, exclusive: false}, 
				function(dirEntry) {
					dirEntry.getFile("dido-money-" + new Date().format("yyyy_mm_dd_HH_MM_ss") + ".txt", 
							{create: true, exclusive: false}, gotFileEntry, ffail);
				}, ffail);
	}, ffail);
	
}

function gotFileEntry(fileEntry) {
    fileEntry.createWriter(gotFileWriter, ffail);
}

function gotFileWriter(writer) {
	var backo = {
		"oc": ocdb().get(),
		"ic": icdb().get(),
		"type": typedb().get()
	};
	
	writer.write(JSON.stringify(backo));
    writer.onwriteend = function(evt) {
    	showAlert("文件已备份SD卡backup目录");
    };
    
}



function ffail(error) {
    showAlert('fail: '+error.code);
}


function pageAbout() {
	
}

/**
 * 通过3d.js绘制环形图的封装， 可绘3d形状
 * **/
!function(){
	var Donut3D={};
	
	function pieTop(d, rx, ry, ir ){
		if(d.endAngle - d.startAngle == 0 ) return "M 0 0";
		var sx = rx*Math.cos(d.startAngle),
			sy = ry*Math.sin(d.startAngle),
			ex = rx*Math.cos(d.endAngle),
			ey = ry*Math.sin(d.endAngle);
			
		var ret =[];
		ret.push("M",sx,sy,"A",rx,ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0),"1",ex,ey,"L",ir*ex,ir*ey);
		ret.push("A",ir*rx,ir*ry,"0",(d.endAngle-d.startAngle > Math.PI? 1: 0), "0",ir*sx,ir*sy,"z");
		return ret.join(" ");
	}

	function pieOuter(d, rx, ry, h ){
		var startAngle = (d.startAngle > Math.PI ? Math.PI : d.startAngle);
		var endAngle = (d.endAngle > Math.PI ? Math.PI : d.endAngle);
		
		var sx = rx*Math.cos(startAngle),
			sy = ry*Math.sin(startAngle),
			ex = rx*Math.cos(endAngle),
			ey = ry*Math.sin(endAngle);
			
			var ret =[];
			ret.push("M",sx,h+sy,"A",rx,ry,"0 0 1",ex,h+ey,"L",ex,ey,"A",rx,ry,"0 0 0",sx,sy,"z");
			return ret.join(" ");
	}

	function pieInner(d, rx, ry, h, ir ){
		var startAngle = (d.startAngle < Math.PI ? Math.PI : d.startAngle);
		var endAngle = (d.endAngle < Math.PI ? Math.PI : d.endAngle);
		
		var sx = ir*rx*Math.cos(startAngle),
			sy = ir*ry*Math.sin(startAngle),
			ex = ir*rx*Math.cos(endAngle),
			ey = ir*ry*Math.sin(endAngle);

			var ret =[];
			ret.push("M",sx, sy,"A",ir*rx,ir*ry,"0 0 1",ex,ey, "L",ex,h+ey,"A",ir*rx, ir*ry,"0 0 0",sx,h+sy,"z");
			return ret.join(" ");
	}

	function getPercent(d){
		return (d.endAngle-d.startAngle > 0.1 ? 
				(d.data.label /* + "(" + Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%)'*/) : '');
		//Math.round(1000*(d.endAngle-d.startAngle)/(Math.PI*2))/10+'%'
	}	
	
	Donut3D.transition = function(id, data, rx, ry, h, ir){
		function arcTweenInner(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieInner(i(t), rx+0.5, ry+0.5, h, ir);  };
		}
		function arcTweenTop(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieTop(i(t), rx, ry, ir);  };
		}
		function arcTweenOuter(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return pieOuter(i(t), rx-.5, ry-.5, h);  };
		}
		function textTweenX(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return 0.6*rx*Math.cos(0.5*(i(t).startAngle+i(t).endAngle)) ;  };
		}
		function textTweenY(a) {
		  var i = d3.interpolate(this._current, a);
		  this._current = i(0);
		  return function(t) { return 0.8*rx*Math.sin(0.5*(i(t).startAngle+i(t).endAngle));  };
		}
		
		var _data = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
			
		d3.select("#"+id).selectAll(".topSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenTop); 
		
		if (rx!=ry) {
			d3.select("#"+id).selectAll(".innerSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenInner); 
			d3.select("#"+id).selectAll(".outerSlice").data(_data)
			.transition().duration(750).attrTween("d", arcTweenOuter); 	
		}
		d3.select("#"+id).selectAll(".percent").data(_data).transition().duration(750)
			.attrTween("x",textTweenX).attrTween("y",textTweenY).text(getPercent); 	
	}
	
	Donut3D.draw=function(id, data, x /*center x*/, y/*center y*/, 
			rx/*radius x*/, ry/*radius y*/, h/*height*/, ir/*inner radius*/){
	
		var _data = d3.layout.pie().sort(null).value(function(d) {return d.value;})(data);
		
		var slices = d3.select("#"+id).append("g").attr("transform", "translate(" + x + "," + y + ")")
			.attr("class", "slices");
		slices.selectAll(".topSlice").data(_data).enter().append("path").attr("class", "topSlice")
			.style("fill", function(d) { return d.data.color; })
			.style("stroke", function(d) { return d.data.color; }).transition().duration(750)
			.attr("d",function(d){ return pieTop(d, rx, ry, ir);})
			.each(function(d){this._current=d;});
		if (rx!=ry) {
			slices.selectAll(".innerSlice").data(_data).enter().append("path").attr("class", "innerSlice")
			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
			.attr("d",function(d){ return pieInner(d, rx+0.5,ry+0.5, h, ir);})
			.each(function(d){this._current=d;});
			slices.selectAll(".outerSlice").data(_data).enter().append("path").attr("class", "outerSlice")
			.style("fill", function(d) { return d3.hsl(d.data.color).darker(0.7); })
			.attr("d",function(d){ return pieOuter(d, rx-.5,ry-.5, h);})
			.each(function(d){this._current=d;});
		}
		slices.selectAll(".percent").data(_data).enter().append("text").attr("class", "percent")
			.attr("x",function(d){return 0.9*rx*Math.cos(0.5*(d.startAngle+d.endAngle));})
			.attr("y",function(d){ return 0.2*ry*Math.sin(0.5*(d.startAngle+d.endAngle));})
			.text(getPercent).each(function(d){this._current=d;});				
	}
	this.Donut3D = Donut3D;
}();



function updateBar(data, xdata, container) {
	var w = $(container).width();
	var h = $(container).height();
	var space = 40;
	
    var xRange = d3.scale.ordinal().rangeRoundBands([0, w], 0.4).domain(xdata);
    var yRange = d3.scale.linear().range([h-space, space]).domain([0,
         d3.max(data, function (d) {return d.s; })
    ]);
    
    var svg = d3.select(container).select("svg");
	svg.selectAll('rect').data(data, function(d) {
		return d.x + d.s;
	}).enter().append('rect')
	 .attr('x', function (d) {
      return xRange(d.x);
    })
    .attr('y', function (d) {
      return yRange(d.s)-h;
    })
    .attr('width', xRange.rangeBand())
    .attr('height', function (d) {
	      return 0; 
    })
    .attr('fill', function (d) {
    	return "#ff7f0e";
    })
	.transition().duration(2000)
	.attr('height', function (d) {
      return h-space - yRange(d.l) ; 
    })
    .attr('width', xRange.rangeBand())
    .attr('x',function(d) {
    	return xRange(d.x);
    })
    .attr('y', function (d) {
      return yRange(d.s);
    }).attr('fill', function (d) {
    	return "#ff7f0e";
    });
}

function drawBar(data, xdata, container, ycontainer) {
	var w = $(container).width();
	var h = $(container).height();
	var space = 40;
	
    var xRange = d3.scale.ordinal().rangeRoundBands([0, w], 0.4).domain(xdata);
    var yRange = d3.scale.linear().range([h-space, space]).domain([0,
         d3.max(data, function (d) {return d.s; })
    ]);
    
	d3.select(container).select("svg").remove();
	var svg = d3.select(container).append("svg").attr("width",w).attr("height",h);
	
    var xAxis = d3.svg.axis().scale(xRange).tickSize(5).tickSubdivide(true);
    
    var yAxis = d3.svg.axis().scale(yRange).tickSize(5).orient("left").tickSubdivide(true);
    
    svg.append('svg:g').attr('class', 'x axis').attr('transform', 'translate(0,' + (h - space) + ')').call(xAxis);
    
    //y轴分离的处理 
    if (ycontainer) {
    	var ysvg = d3.select(ycontainer).append("svg").attr("height", h).attr("width", $(ycontainer).width());
    	ysvg.append('svg:g').attr('class', 'y axis').attr('transform', 'translate(' + (space) + ',0)').call(yAxis);
    } else {
    	svg.append('svg:g').attr('class', 'y axis').attr('transform', 'translate(' + (space) + ',0)').call(yAxis);
    }
    
    svg.selectAll('rect').data(data, function(d) {
    	return d.x + d.s;
    }).enter().append('rect')
    .attr('height', function (d) {
      return h-space - yRange(d.l) ; 
    })
    .attr('width', xRange.rangeBand())
    .attr('x',function(d) {
    	return xRange(d.x);
    })
    .attr('y', function (d) {
      return yRange(d.s);
    }).attr('fill', function (d) {
    	return "#ff7f0e";
    });
}

function getDateId(t) {
	var date = new Date(t);
	return "d" + date.getFullYear() + "" + date.getMonth() + "" + date.getDate(); 
}

function getMonthStart(d) {
	d.setDate(1);
	d.setHours(0, 0, 0);
	return d;
}

function getNextMonthStart(d) {
	if (d==null) d = new Date();
	d = getMonthStart(d);
	var m = new Date(d.getTime() + 40*24*60*60*1000);
	return getMonthStart(m);
}

function getPreMonthStart(d) {
	if (d==null) d = new Date();
	d = getMonthStart(d);
	var m = new Date(d.getTime() - 10*24*60*60*1000);
	return getMonthStart(m);
}

function getFloatFormat(f) {
	return Math.round(f * 10)/10;
}

function isPrice(str) {
	return !isNaN(str) && parseInt(str)>0;
}

function testEmail(str) {
	var reg = /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/; 
	return reg.test(str); 
}

function testMobile(str) {
	var reg = /^(13|14|15|18|17)\d{9}$/;
	return reg.test(str);
}

function showAlert(str) {
	navigator.notification.alert(
			str,  // message
		    function() {},
		    '叮咚提示您',            // title
		    '确定'        
		);
	
}

var COLORS = ["#FF8C00","#9ACD32","#8B0000","#FF69B4","#FF6347","#BA55D3","#48D1CC","#4682B4","#FFA500","#B22222"];
var ci = 0;
function randomColor() {
	 //return '#' + Math.random().toString(16).substring(4);
	ci ++;
	if (ci==COLORS.length) {
		ci = 0;
	}
	return COLORS[ci];
}

function getBigger(array, percent) {
	array.sort(function(a, b) { return b-a});
	var endr = Math.floor(array.length * percent);
	
	if (endr==0) return {list:[],line:0};
	var total = 0;
	for ( var i = 0; i < endr; i++) {
		total += array[i];
	}
	
	var aver = Math.floor(total/endr);
	var result = [];
	
	for ( var i = 0; i < endr && array[i]>aver; i++) {
		result.push(array[i]);
	}
	return {
		list: result,
		line: aver
	};
}


function getConfig(key, dv) {
	var r = localStorage.getItem(key);
	if (r==null) {
		return dv;
	} else {
		return r;
	}
}

function setConfig(key, value) {
	localStorage.setItem(key, value);
} 






var dateFormat = function () {
	var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
		timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
		timezoneClip = /[^-+\dA-Z]/g,
		pad = function (val, len) {
			val = String(val);
			len = len || 2;
			while (val.length < len) val = "0" + val;
			return val;
		};

	// Regexes and supporting functions are cached through closure
	return function (date, mask, utc) {
		var dF = dateFormat;

		// You can't provide utc if you skip other args (use the "UTC:" mask prefix)
		if (arguments.length == 1 && (typeof date == "string" || date instanceof String) && !/\d/.test(date)) {
			mask = date;
			date = undefined;
		}

		// Passing date through Date applies Date.parse, if necessary
		date = date ? new Date(date) : new Date();
		if (isNaN(date)) throw new SyntaxError("invalid date");

		mask = String(dF.masks[mask] || mask || dF.masks["default"]);

		// Allow setting the utc argument via the mask
		if (mask.slice(0, 4) == "UTC:") {
			mask = mask.slice(4);
			utc = true;
		}

		var	_ = utc ? "getUTC" : "get",
			d = date[_ + "Date"](),
			D = date[_ + "Day"](),
			m = date[_ + "Month"](),
			y = date[_ + "FullYear"](),
			H = date[_ + "Hours"](),
			M = date[_ + "Minutes"](),
			s = date[_ + "Seconds"](),
			L = date[_ + "Milliseconds"](),
			o = utc ? 0 : date.getTimezoneOffset(),
			flags = {
				d:    d,
				dd:   pad(d),
				ddd:  dF.i18n.dayNames[D],
				dddd: dF.i18n.dayNames[D + 7],
				m:    m + 1,
				mm:   pad(m + 1),
				mmm:  dF.i18n.monthNames[m],
				mmmm: dF.i18n.monthNames[m + 12],
				yy:   String(y).slice(2),
				yyyy: y,
				h:    H % 12 || 12,
				hh:   pad(H % 12 || 12),
				H:    H,
				HH:   pad(H),
				M:    M,
				MM:   pad(M),
				s:    s,
				ss:   pad(s),
				l:    pad(L, 3),
				L:    pad(L > 99 ? Math.round(L / 10) : L),
				t:    H < 12 ? "a"  : "p",
				tt:   H < 12 ? "am" : "pm",
				T:    H < 12 ? "A"  : "P",
				TT:   H < 12 ? "AM" : "PM",
				Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
				o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
				S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
			};

		return mask.replace(token, function ($0) {
			return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
		});
	};
}();

// Some common format strings
dateFormat.masks = {
	"default":      "ddd mmm dd yyyy HH:MM:ss",
	shortDate:      "m/d/yy",
	mediumDate:     "mmm d, yyyy",
	longDate:       "mmmm d, yyyy",
	fullDate:       "dddd, mmmm d, yyyy",
	shortTime:      "h:MM TT",
	mediumTime:     "h:MM:ss TT",
	longTime:       "h:MM:ss TT Z",
	dateOnly:       "mm月dd日",
	isoDate:        "yyyy-mm-dd",
	isoTime:        "HH:MM:ss",
	isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
	isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
	dayNames: [
		"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
		"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
	],
	monthNames: [
		"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
		"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
	]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
	return dateFormat(this, mask, utc);
};

var isMobile =/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
var isTouchDevice = isMobile;

$.fn.attach = function(cb) {
	attachEvent($(this), cb);
};

$.fn.hold = function(cb, t) {
	if (t==null) {
		t = 1200;
	}
	$(this).bind("touchstart", function(ev) {
		$(this).addClass("pressed");
		var tb = $(this);
		setTimeout(function() {
			if (tb!=null && tb.hasClass("pressed")) {
				$(tb).removeClass("pressed");
				cb($(tb));
			}
		}, t);
	});
	
	$(this).bind("touchend", function() {
		$(this).removeClass("pressed");
	});
	$(this).bind("touchmove", function() {
		$(this).removeClass("pressed");
	});
}

function attachEvent(src, cb) {
	$(src).unbind();
	if (isTouchDevice) {
		$(src).bind("touchstart", function() {
			$(this).addClass("pressed");
			$(this).data("touchon", true);
		});
		$(src).bind("touchend",  function() {
			$(this).removeClass("pressed");
			if($(this).data("touchon")) {
				if ($(this).siblings(".sib").length > 0) {
					if ($(this).hasClass("sibon")) {
						return;
					}
					$(this).siblings(".sib.sibon").removeClass("sibon");
					$(this).addClass("sibon");
					cb($(this));
				} else {
					cb($(this));
				}
			}
			$(this).data("touchon", false);
		});
		$(src).on('touchmove',function (e){
			$(this).data("touchon", false);
			$(this).removeClass("pressed");
		});
	} else {
		$(src).bind("mousedown", function() {
			$(this).addClass("pressed");
		});
		
		$(src).bind("mouseup", function() {
			$(this).removeClass("pressed");
			cb($(this));
		});
	}
}





/*
         http://www.JSON.org/json2.js
         2010-11-17
         Public Domain.
         */
var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null;
        };

        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap, indent, meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"': '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {



        var i, k, v, length, mind = gap,
            partial, value = holder[key];


        if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }


        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }


        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':


            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':


            return String(value);



        case 'object':


            if (!value) {
                return 'null';
            }


            gap += indent;
            partial = [];


            if (Object.prototype.toString.apply(value) === '[object Array]') {


                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }


                v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }


            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {


                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }


            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }


    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {



            var i;
            gap = '';
            indent = '';



            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }



            } else if (typeof space === 'string') {
                indent = space;
            }


            rep = replacer;
            if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }



            return str('', {
                '': value
            });
        };
    }


    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {


            var j;

            function walk(holder, key) {


                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }


            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {


                j = eval('(' + text + ')');


                return typeof reviver === 'function' ? walk({
                    '': j
                }, '') : j;
            }

            throw new SyntaxError('JSON.parse');
        };
    }
}());



// ****************************************
// *
// * End JSON Code Object Handler
// *
// ****************************************       

        
        