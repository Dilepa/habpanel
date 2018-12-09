window.onhashchange = function() {
	window["href"] = null;
};

if (window["loaded"] === undefined) {
	
	Date.isLeapYear = function (year) { 
		return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
	};

	Date.getDaysInMonth = function (year, month) {
		return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	};

	Date.prototype.isLeapYear = function () { 
		return Date.isLeapYear(this.getFullYear()); 
	};

	Date.prototype.getDaysInMonth = function () { 
		return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
	};

	Date.prototype.addMonths = function (value) {
		var n = this.getDate();
		this.setDate(1);
		this.setMonth(this.getMonth() + value);
		this.setDate(Math.min(n, this.getDaysInMonth()));
		return this;
	};
	
	Date.prototype.getDayInWeek = function() {
		var n = this.getDay();
		return (n == 0) ? 6 : n - 1;
	}
	
	Date.prototype.copy = function() {
		return new Date(this.getTime());
	}

	window["loaded"] = true;
	
	var elements = angular.module("app.elements", []);
	var widgets = angular.module("app.widgets", []);

	elements.directive("mdLoad", function() {
		return {
			scope: {},
			restrict: "E",
			link: function($scope, $elem, $attrs) {
				
				if (self.location.href !== window["href"]) {
					
					var parseValue = function(value) {
						return parseFloat(value.replace(/[^\d.-]/g, ""));
					}
					
					window["href"] = self.location.href;
					
					var entries = [];
					var ul = $("div.gridster.gridster-desktop[gridster!='gridsterOptions'] > ul");
					
					ul.children("li").each(function() {
						var li = $(this);
						var styles = li.attr("style").split(";");
						
						var height = 100;
						var custom = li.find(".custom");
						if (custom.length > 0) {
							if (custom.hasClass("half-height")) {
								height = 50;
							}
						} else if (li.find("widget-chart").length > 0) {
							height = 50;
						}
						
						entries.push({top:parseValue(styles[1]), left:parseValue(styles[2]), height, li:li});
					});
					
					entries.sort(function(a, b) {
						if (a.top != b.top) {
							return a.top - b.top;
						} else {
							return a.left - b.left;
						}
					});

					var index = 0;
					var length = entries.length;
					while (index < length) {
						if (entries[index].height == 100) {
							ul.append(entries[index].li);
							index++;
						} else {
							var total = entries[index].height;
							var li = entries[index].li;
							index++;
							while (index < length && entries[index].height != 100 && total < 100) {
								total += entries[index].height
								li.append(entries[index].li.children(".box"));
								entries[index].li.remove();
								index++;
							}
							ul.append(li);
						}
					}
				}
			}
		}		
	});	

	elements.directive("mdValue", mdValue);

	mdValue.$inject = ['OHService'];

	function mdValue(OHService) {

		return {
			scope: {},
			restrict: "E",
			replace: true,
			transclude: true,
			template: function($elem, $attrs) {
				
				var html = [];
				html.push("<span class=\"md value");
				if ($attrs.ngStyle === "progress") {
					html.push(" progress");
				}
				
				html.push("\"><span class=\"value\"></span><span class=\"unit\" ng-transclude></span>");
				if ($attrs.ngStyle === "progress") {
					html.push("<span class=\"progress\"><span></span></span>");
				}
				html.push("</span>");
				
				return html.join("");
			},		
			link: function($scope, $elem, $attrs, $ngModel) {
				
				function updateValue() {
					if ($attrs.ngValueItemName !== undefined) {
						var item = OHService.getItem($attrs.ngValueItemName);
						if (item != null) {
							var state = item.transformedState || item.state;
							if (state !== null && state !== undefined && state !== "NULL") {
								if (item.state === "ON") {
									$($elem).children(".value").addClass("active");
								} else {
									$($elem).children(".value").removeClass("active");
								}
								if (item.stateDescription && item.stateDescription.pattern) {
									var value = item.transformedState || item.state;

									var result = "-";
									try {
										result = sprintf(item.stateDescription.pattern, state).trim();
									} catch(e) {
										$($elem).children(".unit").removeClass("active");
									}
									var pos = result.lastIndexOf(" ");
									if (!isNaN(state)) {
										result = result.replace(".", ",");
									}								
									if (pos != -1) {
										$($elem).children(".value").text(result.substring(0, pos));
										$($elem).children(".unit").addClass("active").text(result.substring(pos + 1));
									} else {
										$($elem).children(".unit").addClass("active").text(result);
									}
								} else {
									$($elem).children(".unit").removeClass("active");
									if (!isNaN(state)) {
										state = state.replace(".", ",");
									}								
									$($elem).children(".value").text(state);
								}
								return;
							}
						}
					}
					
					$($elem).children(".unit").removeClass("active");
					$($elem).children(".value").text("-");
				}
				
				function updateState() {
					var item = OHService.getItem($attrs.ngStateItemName);
					if (item != null) {
						var state = item.state;
						if (state !== null && state !== undefined && state !== "NULL" && state !== NaN) {
							$($elem).find(".progress > span").css("width", state + "%");
						}
					}
				}

				if ($attrs.ngValueItemName !== undefined) {
					OHService.onUpdate($scope, $attrs.ngValueItemName, function() {
						updateValue();
					});
					OHService.onUpdate($scope, $attrs.ngValueItemName);
				}
				if ($attrs.ngStateItemName !== undefined) {
					OHService.onUpdate($scope, $attrs.ngStateItemName, function() {
						updateState();
					});
					OHService.onUpdate($scope, $attrs.ngStateItemName);
				}
			}
		}
	};

	elements.directive("mdState", mdState);

	mdState.$inject = ['OHService'];

	function mdState(OHService) {

		return {
			scope: {},
			restrict: "E",
			require: "?ngModel",
			replace: true,
			template: function($elem, $attrs) {
				
				var html = [];
				html.push("<span ng-class=\"{'active':value, 'inactive':!value}\" class=\"md ");
				var style;
				if ($attrs.ngStyle === "checkbox") {
					style = "checkbox";
				} else if ($attrs.ngStyle === "circle") {
					style = "checkbox circle";
				} else {
					style = "switch";
				}
				
				html.push(style);
				html.push("\">");
				if ($attrs.ngStyle === "checkbox" || $attrs.ngStyle === "circle") {
					html.push("<span class=\"icon\"><svg viewBox=\"0 0 48 48\"><use xlink:href=\"/static/habpanel/svg/control.svg#checkbox\"></use></svg></span>");
				}
				html.push("</span>");

				return html.join("");
			},
				
			link: function($scope, $elem, $attrs, $ngModel) {
					
				$scope.value = null;
				
				var trueValue = "ON";
				var falseValue = "OFF";
				
				if ($attrs.ngTrueValue !== undefined) {
					trueValue = $attrs.ngTrueValue;
				}
				if ($attrs.ngFalseValue !== undefined) {
					falseValue = $attrs.ngFalseValue;
				}
				
				function updateValue() {
					if ($attrs.ngItemName !== undefined) {
						var item = OHService.getItem($attrs.ngItemName);
						if (item != null) {
							if (item.state == trueValue) {
								$scope.value = true;
							} else if (item.state == falseValue) {
								$scope.value = false;
							} else {
								$scope.value = null;
							}
						}						
					} else {
						if ($ngModel.$modelValue == trueValue) {
							$scope.value = true;
						} else if ($ngModel.$modelValue == falseValue) {
							$scope.value = false;
						} else {
							$scope.value = null;
						}						
					}
				}				

				if ($ngModel !== null) {	
					$ngModel.$render = function() {
						updateValue();
					}
				} else if ($attrs.ngItemName !== undefined) {
					OHService.onUpdate($scope, $attrs.ngItemName, function() {
						updateValue();
					});
					OHService.onUpdate($scope, $attrs.ngItemName);
				}
				
				updateValue();
				
				$elem.bind("click", function() {
					$scope.$apply(function() {
						if ($scope.value == null || !$scope.value) {
							$scope.value = true;
						} else {
							$scope.value = false;
						}

						if ($attrs.ngItemName !== undefined) {
							OHService.sendCmd($attrs.ngItemName, $scope.value ? trueValue : falseValue);
						} else if ($ngModel !== undefined) {
							$ngModel.$setViewValue($scope.value ? trueValue : falseValue);
						}
						
						if ($attrs.ngChange !== undefined) {
							$scope.$eval($attrs.ngChange);
						}
					});
				});
			}
		}
	};

	elements.directive("mdButtonGroup", mdButtonGroup);

	mdButtonGroup.$inject = ['OHService'];

	function mdButtonGroup(OHService) {
		
		return {
			scope: {},
			restrict: "E",
			require: "?ngModel",
			replace: true,
			transclude: true,
			template: '<span class="md button-group" ng-transclude></span>',	
			controller: function($element, $scope, $attrs) {
				
				this.index = 0;
				$scope.ngModel = $element.controller("ngModel");

				if ($attrs.ngValues !== undefined) {
					$scope.values = $scope.$eval($attrs.ngValues);
				} else {
					$scope.values = null;
				}
				
				function updateButton(value) {
					if (value !== null && value !== undefined && value !== "NULL") {
						if ($scope.values !== null) {
							if (!isNaN(value)) {
								value = parseInt(value);
							}
							var index = $.inArray(value, $scope.values);
							var buttons = $($element).children(".md.button");
							if (index !== -1) {
								if (!buttons.eq(index).hasClass("active")) {
									buttons.removeClass("active").eq(index).addClass("active");
								}
							}
						}
					}
					
					if ($attrs.ngChange !== undefined) {
						$scope.$eval($attrs.ngChange);
					}					
				}
				
				function updateValue() {
					var value = null;
					if ($attrs.ngItemName !== undefined) {
						var item = OHService.getItem($attrs.ngItemName);
						if (item != null && item !== "NULL") {
							value = item.state;
						}					
					} else {
						value = $scope.ngModel.$modelValue;				
					}
					updateButton(value);
				}			

				if ($scope.ngModel !== null) {	
					$scope.ngModel.$render = function() {
						updateValue();
					}
				} else if ($attrs.ngItemName !== undefined) {
					OHService.onUpdate($scope, $attrs.ngItemName, function() {
						updateValue();
					});
					updateValue();	
				}
				
				this.onClick = function(index) {
					if ($scope.values !== null && $scope.values[index] !== undefined) {
						var value = $scope.values[index];
						if ($attrs.ngItemName !== undefined) {
							OHService.sendCmd($attrs.ngItemName, value);
						} else if ($scope.ngModel !== undefined) {
							$scope.ngModel.$setViewValue(value);
						}
						updateButton(value);
					}
				}
			}
		}
	};		

	elements.directive("mdButton", function() {
		return {
			scope: {},
			restrict: "E",
			replace: true,
			require: "?^mdButtonGroup",	
			transclude: true,
			template: function($elem, $attrs) {
				
				var html = [];
				html.push("<span class=\"md button");
				
				var style;
				if ($attrs.ngStyle === "circle") {
					style = " circle";
				} else if ($attrs.ngStyle === "flat") {
					style = " flat";
				}
				
				html.push(style);
				html.push("\" ng-transclude>");
				html.push("</span>");

				return html.join("");
			},		
			link: function($scope, $elem, $attrs, $parent) {
				
				if ($parent !== null) {
					$scope.index = $parent.index;
					$parent.index += 1;
				}
				
				$($elem).mousedown(function() {
					$(this).addClass("hover");
				}).click(function() {
					if ($attrs !== undefined && $attrs.ngClick !== undefined) {						
						$scope.$eval($attrs.ngClick);
					} else if ($parent !== undefined) {
						$parent.onClick($scope.index);
					}
				});
				$(document).mouseup(function() {
					$($elem).removeClass("hover");
				});
			}
		}		
	});

	// http://jsfiddle.net/ramseyfeng/sbwxxdzp/
	// https://codepen.io/geelen/pen/mnzcf

	elements.directive("mdTabs", function() {
		return {
			scope: {},
			restrict: "E",
			require: "ngModel",
			replace: true,
			transclude: {"panes" : "?mdPane"},
			template: '<div class="md tabs"><ul ng-transclude="panes"></ul><div class="line"></div><div class="content" ng-transclude></div></div>',
			link: function($scope, $elem, $attrs, $ngModel) {
				$scope.tabs = $($elem);
				$scope.attrs = $attrs;
				$scope.ngModel = $ngModel;
				$scope.value = null;
				
				$ngModel.$render = function () {
					$scope.value = $ngModel.$modelValue;
				}
			},
			controller: function($scope) {
				
				$scope.panes = null;
				$scope.index = 0;
				
				$scope.$watch(
					function() {				
						return $scope.tabs.children("ul").height();
					},
					function(height) {

						if (height > 0) {

							$scope.panes = [];
							$scope.tabs.children("ul").children("li").each(function() {
								$scope.panes.push($(this).outerWidth());
							});
							
							$scope.tabs.children(".line").css("top", $scope.tabs.children("ul").height() - 4);
							$scope.select(null, true);
						}
					}
				)

				$scope.action = false;
				
				$scope.select = function(event, init) {
					
					if (event == null) {
						index = $scope.value;
					} else {
						index = $(event.target).parents("li").index();
						if (index == $scope.value) {
							return;
						}
					}
				
					if (!$scope.action && $scope.panes != null) {

						$scope.action = true;

						var left = 0;
						for (var i = 0; i < index; i++) {
							left += $scope.panes[i];
						}
						
						$scope.tabs.children(".line").css({left: left, width: $scope.panes[index]});
						
						$scope.tabs.children("ul").children("li").removeClass("active").eq(index).addClass("active");
						
						if (init === undefined) {
							$scope.tabs.children(".line").addClass("transition");
							
							var content = $scope.tabs.children(".content");
							content.trigger("update");
							
							var copy = content.clone();						
							var tabsWidth = $scope.tabs.width();
							var contentTop = content.position().top;

							var contentStartLeft
							var copyStartLeft;
							var contentEndLeft
							var copyEndLeft;					
							if (index > $scope.ngModel.$modelValue) {
								contentStartLeft = tabsWidth
								copyStartLeft = 0;
								contentEndLeft = 0;
								copyEndLeft = -tabsWidth;
							} else {
								contentStartLeft = -tabsWidth
								copyStartLeft = 0;
								contentEndLeft = 0;
								copyEndLeft = tabsWidth;						
							}
							
							$scope.tabs.css({height: $scope.tabs.children("ul").height() + content.outerHeight(), overflow: "hidden"});
							copy.css({position: "absolute", left: copyStartLeft, top: contentTop});
							$scope.tabs.append(copy);
							content.css({position: "absolute", left: contentStartLeft, top: contentTop});

							$scope.setValue(index);
							
							content.ready(function() {
								
								var height = $scope.tabs.children("ul").height() + content.outerHeight();

								$scope.tabs.addClass("transition").css("height", height);
								
								content.addClass("transition").css("left", contentEndLeft);
								copy.addClass("transition").css("left", copyEndLeft);
								
								setTimeout(function() {
									$scope.tabs.removeClass("transition");
									content.removeClass("transition");
									copy.removeClass("transition");
									copy.remove();
									content.css({position: "relative", top: 0});
									$scope.tabs.css({height: "auto",  overflow: "visible"});
									$scope.action = false;
								}, 400);
							});
						} else {
							$scope.ngModel.$setViewValue(index);
							$scope.action = false;
						}	
					}
				}
				
				$scope.setValue = function(value) {
					if ($scope.value != value) {
						$scope.ngModel.$setViewValue(value);
						if ($scope.value != null && $scope.attrs.ngChange !== undefined) {
							$scope.$eval($scope.attrs.ngChange);
						}
						$scope.value = value;
					}
				}
				
				/*this.incrementIndex = function() {
					$scope.index++;
					return $scope.index - 1;
				}*/
			}
		}
	}).directive("mdPane", function() {
		return {	
			scope: {},
			restrict: "E",
			require: "^mdTabs",
			replace: true,
			transclude: true, 
			template: '<li><a ng-click="getParent().select($event)" ng-transclude></a></li>',
			link: function($scope, $elem, $attrs, $tabsCtrl) {

				$scope.getParent = function() {	
					return $scope.$parent.$parent.$parent;
				}

				$scope.getParent().setValue(0);
				$scope.getParent().select(null, true);
			}
		}	
	});

	elements.directive("mdSelect", mdSelect);

	mdSelect.$inject = ['OHService'];

	function mdSelect(OHService) {
		
		var uniqueId = 1;

		return {
			scope: {},
			restrict: "AE",
			require: "?ngModel",
			replace: true,
			transclude: true,
			template: function($elem, $attrs) {
					
				var html = [];
				html.push("<span ng-click=\"openContent()\" class=\"md select");
				if ($attrs.ngStyle === "date") {
					html.push(" date");
				} else if ($attrs.ngStyle === "time") {
					html.push(" time");
				} else if ($attrs.ngStyle === "temperature") {
					html.push(" temperature");
				} else if ($attrs.ngStyle === "light" || $attrs.ngStyle === "volume") {
					html.push(" slider ");
					html.push($attrs.ngStyle);
				}
				html.push("\"");
				if ($attrs.ngWidth !== undefined) {
					html.push(" style=\"width:");
					html.push($attrs.ngWidth);
					html.push("px\"");
				}
				html.push(">");
				html.push("<span class=\"value\"></span>");			
				html.push("<span class=\"unit\">");
				if ($attrs.ngStyle === "temperature") {
					html.push("°C");
				} else if ($attrs.ngStyle === "light" || $attrs.ngStyle === "volume") {
					html.push("%");
				}
				html.push("</span>");
				html.push("<span class=\"icon\"></span><span class=\"content\" ng-transclude></span></span>");
				return html.join("");
			},
			
			link: function($scope, $elem, $attrs, $ngModel) {
				
				$scope.elementSelect = $($elem);
				$scope.elementContent = $scope.elementSelect.children(".content");
				$scope.attrs = $attrs;
				$scope.ngModel = $ngModel;
				$scope.ngItemName = $attrs.ngItemName;
				$scope.uniqueId = 'select' + uniqueId++;
				
				$scope.updateValue = function() {
					if ($ngModel !== null) {
						$scope.newValue = $ngModel.$modelValue;
					} else {
						var item = OHService.getItem($scope.ngItemName);
						if (item != null) {
							$scope.newValue = item.state;
						}
					}

					var text = "-";
					if ($scope.newValue !== null && $scope.newValue !== undefined && $scope.newValue !== "NULL") {
						if ($attrs.ngStyle === undefined) {
							if ($scope.data[$scope.newValue] !== undefined) {
								text = $scope.data[$scope.newValue];
							}
						} else if ($attrs.ngStyle === "date") {
							var parts = $scope.newValue.split("-");
							if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
								text = ("0" + parts[2]).slice(-2) + "." + ("0" + parts[1]).slice(-2) + "." + parts[0];
							} else {
								var now = new Date();
								$scope.newValue = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
							}
						} else if ($attrs.ngStyle === "temperature") {
							if ($scope.newValue === NaN) {
								$scope.newValue = 20;
							}
							text = parseFloat($scope.newValue).toFixed(1).replace(".", ",");
						} else {
							text = $scope.newValue;
						}
					} else {
						$scope.newValue = null;
					}
					
					$scope.elementSelect.children(".value").text(text);
				};

				if ($ngModel !== null) {
					$ngModel.$render = function() {
						$scope.updateValue();
					}
					$scope.updateValue();
				} else if ($scope.ngItemName !== undefined) {
					OHService.onUpdate($scope, $scope.ngItemName, function() {
						$scope.updateValue();
					});
					OHService.onUpdate($scope, $scope.ngItemName);
				}
			},
			
			controller: function($scope, $compile) {

				$scope.active = false;
				$scope.action = false;
				$scope.data = {};
				$scope.newValue = null;
				$scope.oldValue = null;
				$scope.temp = null;
				
				$scope.slider = {
					value: 0,
					old: 0,
					active: false,
					options: {
						floor: 0,
						ceil: 100,
						keyboardSupport: false,
						hidelimits: true,
						onStart: function() {
							$scope.slider.active = true;
						},
						onChange: function() {
							if (!$scope.slider.active) {
								$scope.changeSlider();
							}
						},
						onEnd: function() {
							$scope.changeSlider();
							$scope.slider.active = false;
						}
					}
				};			
				
				this.addOption = function(option) {
					$scope.options.push(option);
				}
				
				$scope.openContent = function() {

					if (!$scope.active && !$scope.action) {
						
						$scope.oldValue = $scope.newValue;
						
						$scope.action = true;
						
						$scope.temp = null;
						$scope.updateValue();
						
						if ($scope.attrs.ngStyle === "date") {
							
							var date = new Date();
							if ($scope.newValue != null) {
								var parts = $scope.newValue.split("-");
								if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
									date.setDate(Number(parts[2]));
									date.setMonth(Number(parts[1]) - 1);
									date.setFullYear(Number(parts[0]));
								}
							}
	
							var html = [];
							date.setHours(0);
							date.setMinutes(0);
							date.setSeconds(0);
							date.setMilliseconds(0);					
							html.push("<span class=\"header\"><span class=\"icon\"><svg viewBox=\"0 0 48 48\"><use xlink:href=\"/static/habpanel/svg/control.svg#date\"></use></svg></span><span class=\"value\">");
							html.push(("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear());
							html.push("</span></span>");
							html.push("<span class=\"month\">");
							html.push("<table><thead><tr><td><span>");
							html.push(['M','D','M','D','F','S','S'].join("</span></td><td><span>"));
							html.push("</span></td></tr></thead></table>");
							html.push("<span class=\"data\"><table>");
							
							html.push(getDateMonthArea(date.copy().addMonths(-1)));
							html.push("</table></span></span>");
							html.push("<span class=\"year\"><span class=\"data\">");
							html.push("</span></span>");					
							$scope.compileContent(html.join(""));
							
							console.log(date, 1522018800000, date.getTime(), $scope.elementContent.find(".data .table-select[data-timestamp=" + date.getTime() + "]").length);
							$scope.elementContent.find(".data .table-select[data-timestamp=" + date.getTime() + "]").addClass("active");

							
							var scrollDate = date.copy();
							scrollDate.setDate(1);
							var currentMonth = $scope.elementContent.find(".data table > tbody[data-timestamp=" + scrollDate.getTime() + "]");
	
							if (currentMonth.length > 0) {
													
								$scope.elementContent.find(".month > .data").animate({
										scrollTop: currentMonth.position().top - $scope.elementContent.find(".month > table").height() + 1
								}, 500, function() {
									$scope.elementContent.find(".data").bind("scroll", function() {
										var scrollTop = $(this).scrollTop();
										var table = $(this).children("table");
										if (scrollTop < 400 || scrollTop + 400 > table.height() - $(this).height()) {
											var date = new Date();
											if (scrollTop < 400) {
												date.setTime(parseInt(table.children("tbody").first().attr("data-timestamp")));
												table.prepend(getDateMonthArea(date.addMonths(-3)));
											} else {
												date.setTime(parseInt(table.children("tbody").last().attr("data-timestamp")));
												table.append(getDateMonthArea(date.addMonths(1)));
											}
										}
									});						
								});
							}

							$scope.elementContent.find(".data > table").click(function(e) {
								var clicked = $(e.target);
	
								if (clicked.hasClass("table-select")) {
									$scope.selectDate(e, clicked.attr("data-timestamp"));
								}
							});
							
						} else if ($scope.attrs.ngStyle === "time") {
							var hour = 0;
							var minute = 0;
							
							if ($scope.newValue != null) {
								hour = Number($scope.newValue.split(":")[0]);
								minute = Number($scope.newValue.split(":")[1]);
							}
							
							$scope.temp = ("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2);
							
							var html = [];
							html.push("<span class=\"header\"><span class=\"icon\"><svg viewBox=\"0 0 48 48\"><use xlink:href=\"/static/habpanel/svg/control.svg#time\"></use></svg></span><span class=\"value\">");
							html.push(("0" + hour).slice(-2) + ":" + ("0" + minute).slice(-2));
							html.push("</span></span>");
							
							html.push("<span class=\"hour\">");
							for (var h = 0; h <= 23; h++) {
								var text = ("0" + h).slice(-2);
								html.push("<a");
								if (h == hour) html.push(" class=\"active\"");
								html.push(" ng-click=\"selectHour($event, " + h + ")\">" + text + "</a>");
								if (h % 6 == 5) {
									html.push("<br/>");
								}
							}
							html.push("</span>");
							html.push("<span class=\"minute\">");
							for (var m = 0; m <= 55; m += 5) {
								var text = ("0" + m).slice(-2);
								html.push("<a");
								if (m == minute) html.push(" class=\"active\"");
								html.push(" ng-click=\"selectMinute($event, " + m + ")\">" + text + "</a>");
							}					
							html.push("</span>");
							
							$scope.compileContent(html.join(""));
						} else if ($scope.attrs.ngStyle === "temperature") {
							var html = [];
							
							html.push("<span class=\"header\"><span class=\"icon\"><svg viewBox=\"0 0 48 48\"><use xlink:href=\"/static/habpanel/svg/control.svg#temperature\"></use></svg></span><span class=\"value\">");
							if ($scope.newValue !== null) {
								html.push(parseFloat($scope.newValue).toFixed(1).replace(".", ","));
							} else {
								html.push("-");
							}
							html.push("</span><span class=\"unit\">°C</span></span>");						
							
							html.push("<span class=\"setpoint\">");
							html.push("<span class=\"controller\"><span class=\"circle\"><span class=\"value\">22</span><span class=\"unit\">°C</span></span><span class=\"point\"></span></span>");
							html.push("<span class=\"buttons\"><md-button ng-style=\"circle\" ng-click=\"changeTemparature(-0.5)\">-</md-button><md-button ng-style=\"circle\" ng-click=\"changeTemparature(0.5)\">+</md-button></span>");
							html.push("<span class=\"buttons\"><md-button ng-click=\"closeContent()\">Abbrechen</md-button><md-button ng-click=\"selectTemparature($event)\">Ok</md-button></span>");
							html.push("</span>");
							$scope.compileContent(html.join(""));
							$scope.changeTemparature();						
						} else if ($scope.attrs.ngStyle === "light" || $scope.attrs.ngStyle === "volume") {
							
							$scope.slider.value = $scope.newValue;
							
							if ($scope.elementContent.find(".rzslider").length === 0) {
								var html = [];
								html.push("<span class=\"header\"><span class=\"icon\"><svg viewBox=\"0 0 48 48\"><use xlink:href=\"/static/habpanel/svg/control.svg#");
								html.push($scope.attrs.ngStyle);
								html.push("\"></use></svg></span><span class=\"value\">");
								html.push($scope.newValue);
								html.push("</span><span class=\"unit\">%</span></span>");
								html.push("<rzslider rz-slider-model=\"slider.value\" rz-slider-options=\"slider.options\" data-snap-ignore=\"true\"/>"); //
								html.push("<span class=\"buttons\"><md-button ng-click=\"cancelSlider($event)\">Abbrechen</md-button><md-button ng-click=\"closeContent()\">Ok</md-button></span>");
								$scope.compileContent(html.join(""));
								
								interval = setInterval(function () {
									$scope.$broadcast("rzSliderForceRender");
								}, 20);

								setTimeout(function() {
									clearInterval(interval);
								}, 300);								
							} else {
								$scope.elementContent.find(".header .value").html($scope.newValue);
								$scope.slider.value = $scope.newValue;
								$scope.$broadcast("rzSliderForceRender");
							}
						}
						
						var contentWidth = $scope.elementContent.outerWidth();
						var contentPosition = $scope.elementContent.offset();
						var section = $scope.elementSelect.parents(".section:first");
						
						if (contentWidth + contentPosition.left > $("body").width()) {
							$scope.elementContent.css("left", (section.offset().left + section.width()) - (contentPosition.left + contentWidth));
						}

						$scope.elementSelect.addClass("active");
						
						setTimeout(function() {
							$scope.action = false;
							$scope.active = true;
						}, 200);
						
						$(document).bind("click." + $scope.uniqueId, function(e) {
							var clicked = $(e.target);
							
							if (!clicked.is($scope.elementContent) && !clicked.parents().is($scope.elementContent)) {
								if (!$scope.slider.active) {
									if ($scope.attrs.ngStyle === "light" || $scope.attrs.ngStyle === "volume") {
										if ($scope.active && !$scope.action && parseFloat($scope.newValue) !== parseFloat($scope.oldValue)) {
											$scope.cancelSlider(e);
										} else {
											$scope.closeContent();
										}
									} else {	
										$scope.closeContent();
									}
								}
							}
						});
					}
				};
				
				getDateMonthArea = function(date) {
					
					var html = [];

					for (var i = 1; i <= 3; i++) {
						var dayInWeek = date.getDayInWeek();
						var daysInMonth = date.getDaysInMonth();
						date.setDate(1);
						
						var time = date.getTime();
						
						var start;
						var end;
						
						html.push("<tbody data-timestamp=\"");
						html.push(time);
						html.push("\">");
						for (var week = 0; week < 6; week++) {
							html.push("<tr>");
							for (var day = 0; day < 7; day++) {
								var index = week * 7 + day;
								if (index === 0) {
									html.push("<td colspan=\"");
									if (dayInWeek < 3) {
										day = 6;
										start = dayInWeek + 7;
									} else {
										day = 2;
										start = dayInWeek;
									}
									html.push(day + 1);
									end = start + date.getDaysInMonth();
									html.push("\"><span class=\"table-link\" data-timestamp=\"");
									html.push(date.getTime());
									html.push("\">");
									html.push(date.toLocaleString("de-de", {month:"short"}));
									html.push(" ");
									html.push(date.getFullYear());
									html.push("</td>");
								} else {
									html.push("<td>");
									if (index >= start && index < end) {
										date.setDate(index - start + 1)
										html.push("<span class=\"table-select\" data-timestamp=\"");
										html.push(date.getTime());
										html.push("\">");
										html.push(index - start + 1);
										html.push("</span>");
									}
									html.push("</td>");
								}
							}
							html.push("</tr>");
						}
						
						html.push("</tbody>");
						
						date.addMonths(1);
					}
					
					return html.join("");
				};		
				
				$scope.closeContent = function() {
					if ($scope.active && !$scope.action) {
						$scope.action = true;

						$scope.elementSelect.removeClass("active");
						$(document).unbind("click." + $scope.uniqueId);
						
						if ($scope.attrs.ngStyle === "date") {
							$scope.elementContent.find(".data").unbind("scroll");
						}
						
						setTimeout(function() {
							$scope.action = false;
							$scope.active = false;
						}, 200);
					}
				};
				
				$scope.selectContent = function(e, text) {
					e.stopPropagation();
					$scope.newValue = $scope.temp;
					$scope.elementSelect.children(".value").text(text);
					$scope.saveContent();
					$scope.closeContent();
				};
				
				$scope.saveContent = function() {
					if ($scope.ngModel !== null) {
						$scope.ngModel.$setViewValue($scope.newValue);				
					} else if ($scope.ngItemName !== undefined) {
						OHService.sendCmd($scope.ngItemName, $scope.newValue);
					}
					if ($scope.attrs.ngChange !== undefined) {
						$scope.$eval($scope.attrs.ngChange);
					}
				};
				
				$scope.selectHour = function(e, value) {
					if (!$scope.action) {
						$scope.action = true;
						e.stopPropagation();
						
						var elementValue = $scope.elementContent.find(".header > .value");
						$scope.temp = ("0" + value).slice(-2) + ":" + $scope.temp.split(":")[1];
						elementValue.text($scope.temp);
						
						var elementMinute = $scope.elementContent.children(".minute");

						$scope.elementContent.css({height: $scope.elementContent.height()});
						$scope.elementContent.css("height", $scope.elementContent.children(".time").outerHeight() + elementMinute.outerHeight());
						
						$scope.elementContent.children(".hour").addClass("transition");
						elementMinute.addClass("transition");

						setTimeout(function() {
							$scope.elementContent.css("height", "auto");
							$scope.action = false;
						}, 400);
					}
				}
				
				$scope.selectMinute = function(e, value) {		
					var elementValue = $scope.elementContent.find(".header > .value");
					$scope.temp = $scope.temp.split(":")[0] + ":" + ("0" + value).slice(-2);
					elementValue.text($scope.temp);
					$scope.selectContent(e, $scope.temp);
				}
				
				$scope.selectDate = function(e, value) {
					if (!isNaN(value)) {
						var date = new Date(Number(value));
						var elementValue = $scope.elementContent.find(".header > .value");
						$scope.temp = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
						var text = ("0" + date.getDate()).slice(-2) + "." + ("0" + (date.getMonth() + 1)).slice(-2) + "." + date.getFullYear();
						elementValue.text(text);
						$scope.selectContent(e, text);
					}
				}				
				
				$scope.changeTemparature = function(direction) {
					
					if ($scope.temp == null) {
						if ($scope.newValue !== null && $scope.newValue !== undefined && $scope.newValue !== "NULL") {
							$scope.temp = Number($scope.newValue);
						} else {
							$scope.temp = 20;
						}
					}
					if (direction !== undefined) {
						if (direction > 0) {
							$scope.temp += 0.5;
						} else {
							$scope.temp -= 0.5;
						}
						if ($scope.temp > 30) {
							$scope.temp = 30;
						} else if ($scope.temp < 10) {
							$scope.temp = 10;
						}
					}
					var angle = (256 / 20 * ($scope.temp - 10)) + 45 + 7;
					var x = 85 + 75 * Math.sin(-angle * Math.PI / 180);
					var y = 85 + 75 * Math.cos(-angle * Math.PI / 180);
					$scope.elementContent.find(".controller .value").text(parseFloat($scope.temp).toFixed(1).replace(".", ","));
					$scope.elementContent.find(".point").css({"left": x -8, "top": y -8});				
				}
				
				$scope.selectTemparature = function(e) {
					var elementValue = $scope.elementContent.find(".controller .value");
					var value = elementValue.text().replace(",", ".");
					$scope.selectContent(e, parseFloat(value).toFixed(1).replace(".", ","));
				}
				
				$scope.changeSlider = function() {
					console.log("slider ", $scope.slider.value);
					$scope.temp = $scope.slider.value;
					var elementValue = $scope.elementContent.find(".header > .value");
					
					$scope.newValue = $scope.temp;
					elementValue.text($scope.temp);
					
					$scope.elementSelect.children(".value").text($scope.temp);
					$scope.saveContent();
				}
				
				$scope.cancelSlider = function(e) {
					$scope.temp = $scope.oldValue;
					$scope.newValue = $scope.oldValue;
					$scope.selectContent(e, $scope.temp);					
				}
				
				$scope.compileContent = function(html) {
					$scope.elementContent.html("");
					var newElement = angular.element(html);
					var compileElement = $compile(newElement)($scope);
					$scope.elementContent.append(compileElement);
				}
			}	
		}
	}

	elements.directive("mdSelect", mdSelect).directive("mdOption", function() {
		return {
			scope: {selectContent: "&"},
			scope: true,
			restrict: "E",
			require: "^mdSelect",
			replace: true,
			transclude: true,
			template: '<a ng-class="{active:value == select.newValue}" href=\"\" ng-click=\"selectContent($event)\" ng-transclude></a>',
			link: function($scope, $elem, $attrs) {
				
				$scope.select = $scope.$parent.$parent;
				
				var title = $($elem).text();
				if ($attrs.ngValue != undefined) {
					$scope.value = $attrs.ngValue;
				} else {
					$scope.value = title;
				}
				
				$scope.select.data[$scope.value] = title;
				
				$scope.selectContent = function(e) {
					e.stopPropagation();
					$scope.select.newValue = $scope.value;
					$scope.select.elementSelect.children(".value").text($scope.select.data[$scope.value]);
					$scope.select.saveContent();
					$scope.select.closeContent();
				}
			}
		}	
	});

	widgets.controller("heating", function($scope, $log, OHService) {
		
		var vm = this;
		
		$scope.heatingPeriodDays = ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag","Feiertag"];
		$scope.itemRootName = $scope.config.itemRootName != null ? $scope.config.itemRootName : "test";
		$scope.types = ($scope.config.types != null ? $scope.config.types : "party,underfloor,radiator,boiler").split(",");
		$scope.seasons = ($scope.config.seasons != null ? $scope.config.seasons : ",transition1,winter1,summer1").split(",");
		$scope.heatingTemperatureValues = {'TemperatureNormalValue':['Normalbetrieb', 'normal'], 'TemperaturePartyValue':['Partybetrieb','party'], 'TemperatureSaveValue':['Sparbetrieb','save'], 'TemperatureVacationValue':['Urlaub','vacation']};
		$scope.heatingTypes = {};
		$scope.heatingType = null;
		$scope.heatingPeriods = {};
		vm.heatingPeriodDaysList = [];
		vm.heatingPeriodTimeRange = [];
		vm.heatingPeriodSetPoint = "ON";
		$scope.itemPeriodDays = null;
		$scope.itemPeriodTime = null;
		$scope.init = true;
		$scope.imageUrl = "/static/habpanel/svg/icons.svg#";

		for (var i = 0; i < $scope.types.length; i++) {
			if ($scope.heatingTypes[$scope.types[i]] == undefined) {
				if ($scope.types[i] == "underfloor") {
					$scope.heatingTypes[$scope.types[i]] = "Fussboden";
				} else if ($scope.types[i] == "radiator") {
					$scope.heatingTypes[$scope.types[i]] = "Heizkörper";
				} else if ($scope.types[i] == "boiler") {
					$scope.heatingTypes[$scope.types[i]] = "Warmwasser";
				}
			}
		};
		
		$scope.setHeatingType = function(heatingTypeIndex) {
			
			$scope.heatingPeriods = {};
			vm.heatingPeriodDaysList = [];

			var index = 0;
			for (var heatingType in $scope.heatingTypes) {
				if (index == heatingTypeIndex) {
					$scope.heatingType = heatingType;
					break;
				}
				index++;
			}

			for (var i = 0; i < $scope.types.length; i++) {
				if ($scope.types[i] == $scope.heatingType) {
					var itemPeriodName = $scope.itemRootName + (($scope.types[i] == "underfloor" ? "UnderfloorHeating" : $scope.types[i] == "radiator" ? "RadiatorHeating" : "") + "Period" + $scope.seasons[i][0].toUpperCase() + $scope.seasons[i].substring(1));
					if ($scope.seasons[i].indexOf("transition") != -1) {
						$scope.heatingPeriods[itemPeriodName] = "autumn";
					} else if ($scope.seasons[i].indexOf("summer") != -1) {
						$scope.heatingPeriods[itemPeriodName] = "summer";
					} else if ($scope.seasons[i].indexOf("winter") != -1) {
						$scope.heatingPeriods[itemPeriodName] = "winter";
					}
				}
			}
			
			$scope.setHeatingPeriod(0);
		}
		
		$scope.setHeatingPeriod = function(heatingPeriodIndex) {
			
			var index = 0;
			for (var heatingPeriod in $scope.heatingPeriods) {
				if (index == heatingPeriodIndex) {
					$scope.itemPeriodName = heatingPeriod;
					break;
				}
				index++;
			}
			

			$scope.itemPeriodDays = $scope.itemPeriodName + "Days";
			$scope.itemPeriodSetPoint = $scope.itemPeriodName + "SetPoint";		
			
			$scope.getHeatingPeriodDays();
		};
		
		OHService.onUpdate($scope, null, function() {
			if ($scope.init) {
				$scope.getHeatingPeriodDays();
				$scope.init = false;
			}
		});
		
		$scope.getHeatingPeriodDays = function() {
			var value = $scope.getItemValue($scope.itemPeriodDays);
			
			var heatingItemPeriodDays = (value !== "NULL" && value !== "N/A" ? value : "0,0,0,0,0,0,0,0").split(",");
			
			for (var i = 0; i < $scope.heatingPeriodDays.length; i++) {
				vm.heatingPeriodDaysList[i] = heatingItemPeriodDays[i] === "1" ? "1" : "0";
			}
			
			$.each(["TimeFrom", "TimeUntil"], function(index, name) {
				value = $scope.getItemValue($scope.itemPeriodName + name);
				vm.heatingPeriodTimeRange[name] = (value !== "NULL" && value !== "N/A" ? value : "00:00");
			});
			
			vm.heatingPeriodSetPoint = $scope.getItemValue($scope.itemPeriodName + "SetPoint");
		}
		
		$scope.setHeatingPeriodTimeRange = function(name) {
			OHService.sendCmd($scope.itemPeriodName + name, vm.heatingPeriodTimeRange[name]);
		}
		
		$scope.setHeatingPeriodSetPoint = function() {
			OHService.sendCmd($scope.itemPeriodName + "SetPoint", vm.heatingPeriodSetPoint);
		};

		$scope.setHeatingPeriodDays = function() {
			OHService.sendCmd($scope.itemPeriodDays, vm.heatingPeriodDaysList.join(","));
		}

		$scope.getItemValue = function(itemName) {
			return this.itemValue(itemName);
		}
			
		$scope.heatingItemTemperatureValues = {};		
	});

	widgets.controller("rollershutter", function($scope, $element, OHService) {
		
		var vm = this;
		
		$scope.rollerShutterPositionItemName = $scope.config.rollerShutterItemName;
		$scope.rollerShutterAlignmentItemName = $scope.config.rollerShutterItemName + "Alignment";
		$scope.percent = null;
		vm.rollerShutterPosition = 0;
		vm.rollerShutterAlignment = "ON";
		
		$scope.updatePosition = function() {
			var position = 0;
			if (!isNaN(vm.rollerShutterPosition)) {
				position = vm.rollerShutterPosition;
			}
			$($element).find(".position").css("background-position", "0 -" + position + "%");			
		}
		
		$scope.updateAlignment = function() {
			if (vm.rollerShutterAlignment === "ON") {
				$($element).find(".alignment").removeClass("active");
			} else {
				$($element).find(".alignment").addClass("active");
			}	
		}		
		
		OHService.onUpdate($scope, $scope.config.rollerShutterItemName, function() {
			vm.rollerShutterPosition = $scope.itemValue($scope.config.rollerShutterItemName);
			$scope.updatePosition();
		});
		
		OHService.onUpdate($scope, $scope.config.rollerShutterItemName + "AlignmentSwitch", function() {
			vm.rollerShutterAlignment = $scope.itemValue($scope.config.rollerShutterItemName + "AlignmentSwitch");
			$scope.updateAlignment();
		});

		$scope.getItemValue = function(itemName) {
			return OHService.itemValue(itemName);
		}
		
		$scope.setPosition = function() {
			console.log(vm.rollerShutterPosition);
			OHService.sendCmd($scope.config.rollerShutterItemName, vm.rollerShutterPosition);
			$scope.updatePosition();
		}
		
		$scope.setAlignment = function() {
			OHService.sendCmd($scope.config.rollerShutterItemName + "AlignmentSwitch", vm.rollerShutterAlignment);
			$scope.updateAlignment();
		}
	});
	
	widgets.controller("squeezebox", function($scope, $element, OHService) {
		
		var vm = this;
		
		vm.title = "";
		vm.artist = "";
		vm.currentTime = "";
		vm.totalTime = "";
		vm.progressBar = 0;
		
		OHService.onUpdate($scope, $scope.config.itemRootName + "CurrentPlayingTime", function() {

			var currentTimeInSeconds = $scope.itemValue($scope.config.itemRootName + "CurrentPlayingTime");
			var totalTimeInSeconds = $scope.itemValue($scope.config.itemRootName + "TrackDuration");

			if (currentTimeInSeconds === "NULL") {
				vm.currentTime = "";
			} else {
				vm.currentTime = new Date(1970, 0, 1).setSeconds(currentTimeInSeconds);
			}
			
			if (totalTimeInSeconds === "NULL" || totalTimeInSeconds === "0") {
				vm.totalTime = "";
				vm.progressBar = 0;
			} else {
				vm.totalTime = new Date(1970, 0, 1).setSeconds(totalTimeInSeconds);
				if (currentTimeInSeconds !== "NULL" || currentTimeInSeconds !== 0) {
					vm.progressBar = currentTimeInSeconds / (totalTimeInSeconds / 100.0);
				} else {
					vm.progressBar = 0;
				}
			}
		});
		
		OHService.onUpdate($scope, $scope.config.itemRootName + "Title", function() {
			var title = $scope.itemValue($scope.config.itemRootName + "Title");

			if (title === "NULL") {
				vm.title = "";
			} else {
				vm.title = title;
			}
		});
		
		OHService.onUpdate($scope, $scope.config.itemRootName + "Artist", function() {
			var artist = $scope.itemValue($scope.config.itemRootName + "Artist");

			if (artist === "NULL") {
				vm.artist = "";
			} else {
				vm.artist = artist;
			}
		});		
		
		$scope.getItemValue = function(itemName) {
			return OHService.itemValue(itemName);
		}
	});
	
	widgets.controller("light", function($scope, $element, $filter, OHService) {
		
		$scope.items = [];
		
		var itemNames = $scope.config.itemNames.split(",");
		var itemTitles = $scope.config.itemTitles.split(",");
		
		for (var i = 0; i < itemNames.length; i++) {
			
			var types = ["switch", "dimmer"];
			for (var j = 0; j < types.length; j++) {
				if (itemNames[i].toLowerCase().indexOf(types[j], itemNames[i].length - types[j].length) !== -1) {
					var itemRootName = itemNames[i].substring(0, itemNames[i].length - types[j].length);
					var item = {title:itemTitles[i], type:types[j], itemSwitch:itemRootName + "Switch", itemElectricMeterKwh:itemRootName + "ElectricMeterKwh", itemElectricMeterWatt:itemRootName + "ElectricMeterWatt"};
					if (types[j] === "dimmer") {
						item.itemDimmer = itemRootName + "Dimmer";
					}
					$scope.items.push(item);
				}
			}
		}
	});	
}