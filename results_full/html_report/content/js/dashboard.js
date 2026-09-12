/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 92.07920792079207, "KoPercent": 7.920792079207921};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.6171617161716172, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "[1x] POST /api/auth/login"], "isController": false}, {"data": [1.0, 500, 1500, "[1x] GET /api/products"], "isController": false}, {"data": [0.0, 500, 1500, "[1x] GET /api/reports/slow"], "isController": false}, {"data": [1.0, 500, 1500, "[1x] GET /api/health"], "isController": false}, {"data": [0.0, 500, 1500, "[1x] GET /api/reports/sales"], "isController": false}, {"data": [0.0, 500, 1500, "[1x] POST /api/reports/generate"], "isController": false}, {"data": [1.0, 500, 1500, "[1x] POST /api/orders"], "isController": false}, {"data": [1.0, 500, 1500, "[1x] GET /api/products/{id}"], "isController": false}, {"data": [1.0, 500, 1500, "[1x] GET /api/orders/{id}"], "isController": false}, {"data": [0.21428571428571427, 500, 1500, "[1x] GET /api/auth/profile"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 303, 24, 7.920792079207921, 7869.607260726069, 3, 1176307, 14.0, 3611.0000000000223, 5019.2, 7019.5199999999995, 0.039458771509100064, 0.024499965880534207, 0.00945086616235839], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["[1x] POST /api/auth/login", 31, 0, 0.0, 15.064516129032254, 10, 50, 13.0, 25.000000000000007, 39.199999999999974, 50.0, 0.00484234496334423, 0.0016550983761430473, 0.0014064522606487462], "isController": false}, {"data": ["[1x] GET /api/products", 32, 0, 0.0, 14.500000000000005, 10, 38, 12.0, 25.7, 31.49999999999998, 38.0, 0.004201792116860242, 0.009490962076462637, 9.424796160559931E-4], "isController": false}, {"data": ["[1x] GET /api/reports/slow", 30, 0, 0.0, 3007.233333333334, 3004, 3020, 3006.0, 3012.7, 3020.0, 3020.0, 0.00396128451780802, 9.94189571363927E-4, 9.090838493016453E-4], "isController": false}, {"data": ["[1x] GET /api/health", 30, 0, 0.0, 6.433333333333334, 3, 20, 5.0, 18.00000000000002, 19.45, 20.0, 0.004639881763439649, 0.0010557543465639046, 0.0010376298084254685], "isController": false}, {"data": ["[1x] GET /api/reports/sales", 31, 1, 3.225806451612903, 40380.38709677419, 2512, 1176307, 2515.0, 2521.8, 472039.59999999835, 1176307.0, 0.004063318029479504, 0.006068096475097824, 9.062591875225203E-4], "isController": false}, {"data": ["[1x] POST /api/reports/generate", 33, 1, 3.0303030303030303, 31507.333333333336, 3005, 876492, 5006.0, 7007.6, 267861.59999999753, 876492.0, 0.005126114056037747, 0.0017461736179880001, 0.0012508859051280558], "isController": false}, {"data": ["[1x] POST /api/orders", 30, 0, 0.0, 22.000000000000004, 11, 44, 22.0, 29.900000000000002, 38.49999999999999, 44.0, 0.0046838817013856796, 0.0010421331845368203, 0.0012767846799285052], "isController": false}, {"data": ["[1x] GET /api/products/{id}", 29, 0, 0.0, 13.448275862068968, 9, 26, 12.0, 25.0, 26.0, 26.0, 0.00460364227477077, 0.0017769042212224734, 0.001050919012010744], "isController": false}, {"data": ["[1x] GET /api/orders/{id}", 29, 0, 0.0, 14.724137931034482, 10, 30, 13.0, 28.0, 29.0, 30.0, 0.004500266369214578, 0.001559393215895003, 0.0010188338766241112], "isController": false}, {"data": ["[1x] GET /api/auth/profile", 28, 22, 78.57142857142857, 4.964285714285715, 3, 7, 5.0, 6.100000000000001, 7.0, 7.0, 0.0044103044874218116, 8.580035725041456E-4, 0.0010185908313234946], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["401/Unauthorized", 22, 91.66666666666667, 7.260726072607261], "isController": false}, {"data": ["Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 2, 8.333333333333334, 0.6600660066006601], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 303, 24, "401/Unauthorized", 22, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 2, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["[1x] GET /api/reports/sales", 31, 1, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["[1x] POST /api/reports/generate", 33, 1, "Non HTTP response code: java.net.SocketTimeoutException/Non HTTP response message: Read timed out", 1, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["[1x] GET /api/auth/profile", 28, 22, "401/Unauthorized", 22, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
