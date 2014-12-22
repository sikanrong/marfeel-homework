/**
 * Alex Pilafian - 12/21/14.
 */


//first, the data (emulates the output of a real JSON API)
$data = [
    {title: "REVENUE",
     type: "currency",
     total_amount: 200000,
     tablet_share: 120000,
     smartphone_share: 80000},

    {title: "IMPRESSIONS",
    type: "units",
    total_amount: 50000000,
    tablet_share: 20000000,
    smartphone_share: 30000000},

    {title: "VISITS",
    type: "units",
    total_amount: 600000000,
    tablet_share: 480000000,
    smartphone_share: 120000000}
]

var $dashboardApp = angular.module('dashboardApp', []);

$dashboardApp.controller('dashboardCtrl', function ($scope) {

    $scope.dashboard_widgets = $data;

}).directive('widgetGraph', function() {

    return {
        restrict: 'E',
        scope: {
            data: '=data'

        },
        link: function( scope, element, attributes ) {

            scope.widgetNumberFmt = function(amt){
                var total_opts = {}
                if(scope.data.type == "currency"){
                    total_opts = {
                        style: "currency",
                        currency: "EUR",
                        currencyDisplay: "symbol"
                    }
                }
                return amt.toLocaleString("es-ES", total_opts);
            }

            scope.getPercentOfTotal = function(amt){
                return "%"+parseInt((amt/scope.data.total_amount)*100);
            }


            var _side_length = 160;
            var _ring_width = 8;

            var _graph_el = element.find("div.graph");
            var _selection = d3.select(_graph_el.get(0));
            _selection.style("width", _side_length+"px");

            var _graph_data = [scope.data];

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


            scope.primaryColor = getRandomColor();
            scope.secondaryColor = shadeColor(scope.primaryColor, -25);

            var svg = _selection
                .append("svg")
                .attr('width', _side_length)
                .attr('height', _side_length);

            scope.$watch('data', function(newVals, oldVals) {
                return scope.render(newVals);
            }, true);

            scope.render = function(data) {
                svg.selectAll('*').remove();

                var ratio=(data.tablet_share / data.total_amount);
                var endAngle=Math.min(360*ratio,360);
                endAngle=endAngle * Math.PI/180;

                var _tablet_arc = d3.svg.arc()
                    .startAngle(0)
                    .endAngle(endAngle)
                    .innerRadius(_side_length/2 - _ring_width)
                    .outerRadius(_side_length/2); //just radians

                var _smartphone_arc = d3.svg.arc()
                    .startAngle(endAngle)
                    .endAngle(360 * Math.PI/180)
                    .innerRadius(_side_length/2 - _ring_width)
                    .outerRadius(_side_length/2); //just radians

                var path = svg.selectAll('.arc').data([data]);

                path.enter().append("path")
                    .attr("class","arc_primary")
                    .attr("transform", "translate(" + _side_length/2 + "," + _side_length/2 + ")")
                    .attr("d", _tablet_arc)
                    .style("fill", scope.primaryColor);

                path.enter().append("path")
                    .attr("class","arc_secondary")
                    .attr("transform", "translate(" + _side_length/2 + "," + _side_length/2 + ")")
                    .attr("d", _smartphone_arc)
                    .style("fill", scope.secondaryColor);

                var label = svg.selectAll(".label").data([data]);
                label.enter().append("text")
                    .attr("y",_side_length/2)
                    .attr("x",_side_length/2)
                    .attr("width",_side_length)
                    .text(function (d) { return d.title})
                    .attr("class", "title_label")
                    .attr("text-anchor", "middle");



                label.enter().append("text")
                    .attr("y",_side_length/2)
                    .attr("x",_side_length/2)
                    .attr("width",_side_length)
                    .text(function (d) { return scope.widgetNumberFmt(d.total_amount) })
                    .attr("class", "total_amount_label")
                    .attr("text-anchor", "middle");

            }


        },
        template: $(".widgetGraphTemplate")
    };
});
