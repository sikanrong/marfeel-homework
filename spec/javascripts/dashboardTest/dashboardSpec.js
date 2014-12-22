

describe('Test Dashboard Controller', function() {
    beforeEach(module('dashboardApp'));

    var $controller;

    beforeEach(inject(function(_$controller_){
        $controller = _$controller_;
    }));


    it('Sets the dashboard_widgets data from the server API data.', function() {
        var $scope = {};
        var controller = $controller('dashboardCtrl', { $scope: $scope });
        expect($scope.dashboard_widgets).not.toBeNull();
        expect($scope.dashboard_widgets.length).toBe($data.length);
    });

});

describe('Test Directive: widgetGraph', function() {

    var $compile,
        $rootScope,
        $httpBackend;

    var element, scope;

    beforeEach(function () {

        module('dashboardApp');

        var directive_markup = "<widget-graph data='widget_data'></widget-graph>";
        var jasmine_tpl_path = "/app/views/dashboard/widget_graph_template.html.erb"; //full filesystem path
        var app_tpl_path = "/dashboard/widget_graph_template"; //routed path
        element = angular.element(directive_markup);

        inject(function($templateCache) {

            //Manually fetch the template code from where it is stored relative to the Jasmine test server,
            //and add it to the templateCache where the app would normally be looking for it.

            //This gets around errors from angular-mock for unexpected requests, and makes the directive template code
            //available without having to messy up the code or copy it.
            var directiveTemplate;
            $.ajax({type: "GET",
                    url: jasmine_tpl_path,
                    async: false}).done(function(data){
                directiveTemplate = data;
            });

            $templateCache.put(app_tpl_path, directiveTemplate);
        });

        inject(function ($rootScope, $compile) {
            scope = $rootScope.$new();
            scope.widget_data = $data[0]; //set the data for this test to the first data in the mock data array.
            $compile(element)(scope);
            scope.$digest();
            scope.$apply();
        });

    });

    it('Sets the data of the inner directive scope with that which is passed in.', function() {
        //element.isolateScope().data is what it sets internally from
        //scope.widget_data, which is what we passed in
        expect(element.isolateScope().data).toBe(scope.widget_data);
    });

    it('Renders an SVG element within the directives template.', function() {
        expect(element.find("svg").length).toBeGreaterThan(0);
    });

    it('Renders a graph consisting of two paths.', function() {
        expect(element.find("svg").find("path").length).toBe(2);
    });

    it('Renders the title in the title label.', function() {
        var dta = scope.widget_data;
        expect(element.find(".title_label").text()).toBe(dta.title);
    });

    it('Follows regional formatting rules for units output.', function() {
        var dta = scope.widget_data;
        expect(element.find(".total_amount_label").text())
            .toBe(element.isolateScope().widgetNumberFmt(dta.total_amount));
    });

    it('Follows the correct regional formatting rules for currency.', function() {
        var dta = scope.widget_data;
        var formatted = element.isolateScope().widgetNumberFmt(dta.total_amount);

        var expected = dta.total_amount.toLocaleString("es-ES", {
            style: "currency",
            currency: "EUR",
            currencyDisplay: "symbol"
        });
        expect(formatted).toBe(expected);
        expect(formatted).toContain("€");
    });

    it('Correctly represents the tablet share of the total.', function() {
        var dta = scope.widget_data;
        var el_txt = element.find(".tabletData .subTotal").text().replace(/\./g, "");
        var displayed_number = parseInt(el_txt);
        expect(displayed_number).toBe(dta.tablet_share);
    });

    it('Correctly calculates the tablet percentage of the total.', function() {
        var dta = scope.widget_data;
        var el_txt = element.find(".tabletData .percent").text().replace(/%/g, "");
        var displayed_pct = parseInt(el_txt);
        var calculated_pct = parseInt((dta.tablet_share/dta.total_amount)*100);
        expect(displayed_pct).toBe(calculated_pct);
    });

});