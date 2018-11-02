var QW = QW || {};
QW.Modules = QW.Modules || {};


QW.Modules.AppView = function (container) {
	this.constructor(container);
};

QW.Modules.AppView.prototype = {

	container: null,

	constructor: function (container, app) {

		var that = this;
		this.container = container;

		this.data = new can.Map();
		this.data.attr("app", app || QW.Base.urlParams.app);

		QW.Base.setGetParams({ app: this.data.app });
		this.fetchApps();
		this.initEventListeners();

		return this;

	},

	tabActivation: function (params) {
		if (params !== undefined && params[0] !== this.data.app) {
			this.data.attr("app", params[0]);
			this.fetchAppData();
		}
		QW.Base.setGetParams({ app: this.data.app });
		QW.Base.setActive("AppView")

	},


	initEventListeners: function () {

		var that = this;
		$(this.container).on("change", "select.application", function () {
			var app = $(this).val();
			that.data.attr("app", app);
			try {
				$('#bankstoshow').hide();				
				that.data.attr("bankstoshow", []);
			} catch (e) { }
			try {
				$('#importlogs').hide();
				that.data.attr("importlogs", []);
			} catch (e) { }
			try {
				$('#importlogdetails').hide();
				that.data.attr("importlogdetails", []);
			} catch (e) { }

			that.currentStatusLog = null;

			QW.Base.setGetParams({ app: that.data.app });
			that.fetchAppData();
		})

		// Anzeigen der Banken (Prod und Vorprod), die diese Produkte haben....
		$(this.container).on("click", "div.institutes", function () {
			that.showBanks();
		});

		// Anzeigen der Importlogs
		$(this.container).on("click", "div.importlogdetails", function () {
			// Takes the last date of an active import an calls "showImportLogDetails()"	
			that.showCurrentImportDetails();
		});

		// Anzeigen der Importlogs
		$(this.container).on("click", "a[data-log-date]", function () {
			var date = $(this).data("log-date");
			that.showImportLogDetails(date);
		});

		// Anzeigen der Importlogs
		$(this.container).on("click", "div.importlogs", function () {
			that.showImportLogHistory();
		});

		$(this.container).on("click", "button.importManual", function () {
			QW.Modules.ImportedData.importManual(this, function () {

				that.fetchAppData();
			});
		});



	},

	fetchApps: function () {

		var that = this;
		socket.emit("helper/getListOf", { sheetId: 1, attributes: ["id", "Anwendung"] }, function (err, data) {

			var applist = [];
			for (var x in data) {
				applist.push({ id: x, name: data[x].Anwendung });
			}
			applist.sort(function (a, b) {
				if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
				else return -1;
			});
			that.data.attr("applist", applist);
			// Nun das Template laden...
			$(that.container).append(can.view("templates/appView.html")(that.data));
			that.fetchAppData();

		});

	},

	fetchAppData: function () {

		var that = this;

		that.data.attr("currentProdCount", 0);
		that.data.attr("lastUpdate", null);
		that.data.attr("initialDate", null);
		that.data.attr("importlogs", []);

		// Backend nach Daten für die Anwendung fragen....
		// Daten holen: 
		// => 1. Importlogs für diese Anwendung, um den aktuellen Stand und die Historie darzustellen.
		socket.emit("helper/getAppImportlogs", { name: this.data.app }, function (err, data) {

			//Speichern...
			that.importlogs = data;

			// WICHIG: 		
			// Wenn der letzte Eintrag ein "imported:false" hat, dann darf eine Schaltfläche zum Importieren angezeigt werden!
			if (that.importlogs.length > 0) {
				if (that.importlogs[that.importlogs.length - 1].imported == false) that.importlogs[that.importlogs.length - 1].importButton = true;
				else that.importlogs[that.importlogs.length - 1].importButton = false;
			}

			that.showImportLogHistory();

			// EChart timeline....
			var chart = document.getElementById('echart');
			var myChart = echarts.init(chart);

			var option = {
				color: ['steelblue', 'orange', 'black'],
				title: {
					text: 'Institute mit Anwendung: ' + that.data.app,
					subtext: 'Stand: ' + moment().format("DD.MM.YYYY HH:mm")
				},
				tooltip: {
					trigger: 'item',
					formatter: function (params) {

						var value = moment(params.value[0]).format("DD.MM.YYYY HH:mm:ss") + '<br/>';
						value += "Anzahl: " + params.value[1] + '<br/>';


						if (params.seriesName == "Produktion") {
							// Hier gibt es ausführlichere Statistiken....
							value += '<div style=padding:5px;border-radius:3px;background:white;>';
							value += '<span style="color:green"><i class="fa fa-arrow-circle-right" style="transform:rotate(-45deg)"></i> +' + params.value[2] + '</span>&nbsp;&nbsp;&nbsp;';
							value += '<span style="color:red"><i class="fa fa-arrow-circle-right" style="transform:rotate(45deg)"></i> -' + params.value[3] + '</span>';
							value += '</div>';

							if (params.value[4] !== null) {
								value += "<br><div style='font-size:0.8em;padding:2px;background:white;color:#333;border:1px solid red;'><strong>Manuell übersteuert</strong><br>" + moment(params.value[4]).format("DD.MM.YYYY HH:mm:ss") + "<br>";
								// Grund....
								value += params.value[5]
								value += "</div>";
							}
						}


						return value;

					}
				},
				toolbox: {
					show: false,
					feature: {
						mark: { show: false },
						dataView: { show: false, readOnly: false },
						saveAsImage: { show: true }
					}
				},
				dataZoom: {
					show: true,
					start: 0
				},
				grid: {
					y2: 80
				},
				xAxis: [
					{
						type: 'time',
						splitNumber: 10,
						axisLabel: {
							formatter: function (value) {
								return moment(value).format("DD.MM.YYYY");
							}
						}
					}
				],
				legend: {
					x: "right",
					data: ['Produktion', 'Vorproduktion']
				},
				yAxis: [
					{
						type: 'value',
						max: 500
					}
				],
				series: [
					{
						name: 'Produktion',
						type: 'line',
						showAllSymbol: true,
						symbolSize: 10,
						data: (function () {
							var points = [];
							// Wert zuvor....
							var bank21Count = null;
							var currentProdCount = 0;

							for (var x in data) {

								if (data[x].b21Count !== bank21Count && data[x].imported == true) {


									var added = that.str2JSON(data[x].b21Added, []).length;
									var deleted = that.str2JSON(data[x].b21Deleted, []).length;

									var point = {
										value: [
											moment(data[x].createdAt).toDate(),
											data[x].b21Count,
											added,
											deleted,
											data[x].forcedAt,
											data[x].overwriteCause
										]
									};

									// Wenn übersteuert wurde, kennzeichnen
									if (data[x].forcedAt !== null) {
										point.symbol = "circle";
										point.symbolSize = 15;
										point.itemStyle = {
											normal: {
												label: {
													formatter: function (params) {
														return "Manuell übersteuert";
													},
													show: true,
													textStyle: {
														fontSize: '11',
														fontFamily: 'Verdana',
														fontWeight: 'bold'
													}
												}
											}
										}
									};
									points.push(point)

									bank21Count = data[x].b21Count;
									currentProdCount = data[x].b21Count;
									that.currentStatusLog = data[x];
								}
							}

							if (points.length > 0) {
								that.data.attr("lastUpdate", moment(points[points.length - 1].value[0]).calendar());
								that.data.attr("initialDate", moment(points[0].value[0]).calendar());
							} else {
								that.data.attr("lastUpdate", null);
								that.data.attr("initialDate", null);
							}
							// Anzahl der Änderungen - 1 ... damit werden die Änderungen
							// seit Initialbefüllung angezeigt
							if (points.length > 0) {
								that.data.attr("prodChangesCount", points.length - 1);
							} else {
								that.data.attr("prodChangesCount", "-");
							}
							// Aktueller Anzahl 
							that.data.attr("currentProdCount", currentProdCount);


							// Wenn der letzte Import NICHT erfolgreich war, soll das hier angezeigt werden!!!!
							// daher prüfen....
							if (data.length > 0 && data[data.length - 1].imported == false) {

								var p = data[data.length - 1];
								// Einene Punkt hinzufügen, der als FEHLER gekennzeichnet wird!
								var added = that.str2JSON(p.b21Added, []).length;
								var deleted = that.str2JSON(p.b21Deleted, []).length;
								var point = {
									value: [
										moment(p.createdAt).toDate(),
										p.b21Count,
										added,
										deleted,
										p.forcedAt
									]
								};
								point.symbol = "triangle";
								point.symbolSize = 15;
								point.itemStyle = {
									normal: {
										label: {
											formatter: function (params) {

												return "NICHT IMPORTIERT";
											},
											show: true,
											textStyle: {
												fontSize: '11',
												fontFamily: 'Verdana',
												fontWeight: 'bold'
											}
										}
									}
								}

								points.push(point)


							}



							return points;
						})()
					},
					{
						name: 'Vorproduktion',
						type: 'line',

						showAllSymbol: true,
						symbolSize: 10,
						data: (function () {
							var points = [];

							// Wert zuvor....
							var vorprodCount = null;

							for (var x in data) {

								if (data[x].vorprodCount !== vorprodCount && data[x].imported == true) {

									var added = that.str2JSON(data[x].vorprodAdded, []).length
									var deleted = that.str2JSON(data[x].vorprodDeleted, []).length;

									points.push([
										moment(data[x].createdAt).toDate(),
										data[x].vorprodCount,
										added,
										deleted,
										data[x].forcedAt
									])
									vorprodCount = data[x].vorprodCount;
								}
							}
							return points;
						})()
					}

				]
			};
			myChart.setOption(option);
			myChart.on('click', function (params) {

				// params.value is the axis label before formatted

				if (params.seriesName == "Produktion") {
					that.showImportLogDetails(params.data.value[0]);
				}
			});

		});

	},

	showBanks: function () {

		var that = this;
		// Fetch all Institutes from the last importlog.....
		if (that.currentStatusLog == undefined || that.currentStatusLog == null) {
			that.data.attr("bankstoshow", []);
			return false;
		}

		var data = this.str2JSON(that.currentStatusLog.data, {});

		socket.emit("helper/getListOf", { sheetId: 2, attributes: ["id", "Bankname", "B21 Institutsnummer", "AG21 RZBK Vorproduktion", "AG21 RZBK", "RZBK-Wechsel", "Serie", "Migrationsdatum"] }, function (err, banks) {

			var banksToShow = [];
			for (var x in banks) {
				// Wenn die BankNr oder die Vorprodnr passt, dann anzeigen....
				if (data.b21.indexOf(banks[x]["B21 Institutsnummer"]) !== -1) {
					if (data.vorprod.indexOf(banks[x]["AG21 RZBK Vorproduktion"]) !== -1) {
						banks[x].__vorprod = true;
					}
					banksToShow.push(banks[x]);
				}
			}

			banksToShow.sort(function (a, b) {
				return a.Serie > b.Serie;
			})
			that.data.attr("bankstoshow", banksToShow);
			var fragment = can.view("templates/appView_banks.html")(that.data)

			$(that.container).find("div.details").html(fragment).find("table").DataTable().order([[0, 'asc']]).draw();
		});

	},


	str2JSON(object, defaultValue) {

		if (typeof object !== "string") {
			if (object == null || object == undefined) return defaultValue;
			return object;
		}
		try {
			var value = JSON.parse(object);
			if (value == undefined || value == null) return defaultValue;
			else return value;
		} catch (e) {
			return defaultValue;
		}

	},


	showImportLogHistory: function () {

		var that = this;

		// Ordnen....neuestes Datum oben!
		var logs = JSON.parse(JSON.stringify(this.importlogs));
		logs.sort(function (a, b) {
			return a.createdAt < b.createdAt;
		})
		for (var x in logs) {
			if (typeof logs[x].b21Added == "string") {
				try {
					logs[x].b21Added = JSON.parse(logs[x].b21Added);
				} catch (e) {
					logs[x].b21Added = 0;
				}
			}
			if (typeof logs[x].b21Deleted == "string") {
				try {
					logs[x].b21Deleted = JSON.parse(logs[x].b21Deleted);
				} catch (e) {
					logs[x].b21Deleted = 0;
				}
			}

		}
		//if(logs.length > 0)console.log(logs[0].importButton, logs[0].createdAt);
		this.data.attr("importlogs", logs);

		var fragment = can.view("templates/appView_loghistory.html")(that.data);
		$(that.container).find("div.details").html(fragment).find("table").DataTable().order([[1, 'desc']]).draw();
	},

	showCurrentImportDetails: function () {
		// Take the last (valid) importlog-entry....
		if (this.currentStatusLog == null) return;
		this.showImportLogDetails(this.currentStatusLog.createdAt);
	},

	showImportLogDetails: function (date) {

		var that = this;

		if (typeof date !== "string") date = date.toISOString();

		var data = null;
		// Get the data to show via date
		for (var x in this.importlogs) {
			if (this.importlogs[x].createdAt == date) {
				data = this.importlogs[x];
				break;
			}
		}

		if (data == null) return;

		if (typeof data.b21Added == "string") {
			try {
				data.b21Added = JSON.parse(data.b21Added);
			} catch (e) {
				data.b21Added = 0;
			}
		}
		if (typeof data.b21Deleted == "string") {
			try {
				data.b21Deleted = JSON.parse(data.b21Deleted);
			} catch (e) {
				data.b21Deleted = 0;
			}
		}

		if (typeof data.data == "string") {
			try {
				data.data = JSON.parse(data.data);
			} catch (e) {
				data.data = {};
			}
		}

		this.data.attr("importlogdetails", data);
		var fragment = can.view("templates/appView_logDetail.html")(that.data);
		$(that.container).find("div.details").html(fragment);
	}

}
