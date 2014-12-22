/**
 * Alex Pilafian - 12/21/14.
 */


// first, the data (emulates the output of a real JSON API)
// "unit_type" is just meant to flag any special display characteristics the numbers might need.
$data = [
    {title: "REVENUE",
     unit_type: "currency",
     total_amount: 200000,
     tablet_share: 120000,
     smartphone_share: 80000},

    {title: "IMPRESSIONS",
    unit_type: null,
    total_amount: 50000000,
    tablet_share: 20000000,
    smartphone_share: 30000000},

    {title: "VISITS",
    unit_type: null,
    total_amount: 600000000,
    tablet_share: 480000000,
    smartphone_share: 120000000}
]

//The main angular application object
var $dashboardApp = angular.module('dashboardApp', []);

//the main application controller, where the API data is set inside the angular scope...
$dashboardApp.controller('dashboardCtrl', function ($scope) {

    $scope.dashboard_widgets = $data;

});

// This is the main directive definition for a "widgetGraph",
// which is the repeating display element on this page, including a ring-graph and data readout.
$dashboardApp.directive('widgetGraph', function() {

    return {
        restrict: 'E',
        scope: {
            //Node: this directive only handles the data for rendering ONE widget.
            data: '=data'

        },

        //Inside the link function is where all of the D3JS graph drawing logic goes
        link: function( scope, element, attributes ) {

            //directive-scope method for formatting numbers according to this widget's "unit_type"
            //Used in the template.
            scope.widgetNumberFmt = function(amt){
                var total_opts = {}
                if(scope.data.unit_type == "currency"){
                    total_opts = {
                        style: "currency",
                        currency: "EUR",
                        currencyDisplay: "symbol"
                    }
                }

                return amt.toLocaleString("es-ES", total_opts);
            }

            //Simple function to print the percentage of the total_amount, based on the passed "amt" parameter
            scope.getPercentOfTotal = function(amt){
                return "%"+parseInt((amt/scope.data.total_amount)*100);
            }

            //Defines critical display attributes such as graph dimensions and ring thickness.
            var _side_length = 160;
            var _ring_width = 8;

            //The element where we want our graph to appear.
            var _graph_el = element.find("div.graph");
            var _selection = d3.select(_graph_el.get(0));
            _selection.style("width", _side_length+"px"); //sets the container width dynamically from _side_length.

            //A javascript function that generates aesthetically pleasing colors, based on the golden ratio
            //https://gist.github.com/slimfadi/6335549
            function getRandomColor(){
                var h=Math.random(),
                    s=0.5,
                    v=0.95,
                    golden_ratio=0.618033988749895,
                    h_i,f,p,q,t,r,g,b;

                h+=golden_ratio;
                h%=1;

                //convert from h,s,v color system to r,g,b
                h_i = Math.floor(h*6);
                f = h*6 - h_i;
                p = v * (1-s);
                q = v * (1 - f*s);
                t = v * (1 - (1 - f) * s);
                switch (h_i) {
                    case 0 :
                        r=v;
                        g=t;
                        b=p;
                        break;
                    case 1:
                        r=q;
                        g=v;
                        b=p;
                        break;
                    case 2:
                        r=p;
                        g=v;
                        b=t;
                        break;
                    case 3:
                        r=p;
                        g=q;
                        b=v;
                        break;
                    case 4:
                        r=t;
                        g=p;
                        b=v;
                        break;
                    case 5:
                        r=v;
                        g=p;
                        b=q;
                        break;
                }

                var decColor = parseInt(r*256) + 256 * parseInt(g*256) + 65536 * parseInt(b*256);
                return "#"+decColor.toString(16);
            }

            //Programmatically Lighten or Darken a hex color
            //http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
            function shadeColor(color, percent) {
                var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
                return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
            }

            //Sets the primary/secondary color for this widget.
            //primaryColor is generated randomly, secondaryColor is primaryColor darkened by 25%.
            scope.primaryColor = getRandomColor();
            scope.secondaryColor = shadeColor(scope.primaryColor, -25);

            //Create SVG element. Set dimensions to (_side_length x _side_length)
            var svg = _selection
                .append("svg")
                .attr('width', _side_length)
                .attr('height', _side_length);

            //Add a watch to call render if the data changes (or when the data is initially set)
            scope.$watch('data', function(newVals, oldVals) {
                return scope.render(newVals);
            }, true);

            //Graph render function
            scope.render = function(data) {

                //First clean the SVG of old children
                svg.selectAll('*').remove();

                //Figure the correct endAngle in radians based on the ratio of smartphone_share to the total.
                var ratio=(data.smartphone_share / data.total_amount);
                var endAngle=Math.min(360*ratio,360);
                endAngle=endAngle * Math.PI/180;

                //Define the tablet arc based on the calculated endAngle
                var _tablet_arc = d3.svg.arc()
                    .startAngle(0)
                    .endAngle(endAngle)
                    .innerRadius(_side_length/2 - _ring_width) //ring thickness
                    .outerRadius(_side_length/2);

                //The Smartphone arc is just the remaining radians between endAngle and 2*PI (= 360 degrees)
                var _smartphone_arc = d3.svg.arc()
                    .startAngle(endAngle)
                    .endAngle(360 * Math.PI/180)
                    .innerRadius(_side_length/2 - _ring_width)
                    .outerRadius(_side_length/2);

                //sets the data to create the D3.JS paths
                var path = svg.selectAll('.arc').data([data]);

                //Create the first arc
                path.enter().append("path")
                    .attr("class","arc_primary")
                    .attr("transform", "translate(" + _side_length/2 + "," + _side_length/2 + ")") //sets arc to center position
                    .attr("d", _tablet_arc)
                    .style("fill", scope.primaryColor); //dynamically set fill color based on calculated color pair...

                //Create the second arc
                path.enter().append("path")
                    .attr("class","arc_secondary")
                    .attr("transform", "translate(" + _side_length/2 + "," + _side_length/2 + ")")
                    .attr("d", _smartphone_arc)
                    .style("fill", scope.secondaryColor);

                //Title Label
                var label = svg.selectAll(".label").data([data]);
                label.enter().append("text")
                    .attr("y",_side_length/2)
                    .attr("x",_side_length/2)
                    .attr("width",_side_length)
                    .text(function (d) { return d.title})
                    .attr("class", "title_label")
                    .attr("text-anchor", "middle");


                //Total amount label (correctly formatted by scope.widgetNumberFmt)
                label.enter().append("text")
                    .attr("y",_side_length/2)
                    .attr("x",_side_length/2)
                    .attr("width",_side_length)
                    .text(function (d) { return scope.widgetNumberFmt(d.total_amount) })
                    .attr("class", "total_amount_label")
                    .attr("text-anchor", "middle");

            }


        },
        template: $(".widgetGraphTemplate") //inline template element for the widgetGraph
    };
});
