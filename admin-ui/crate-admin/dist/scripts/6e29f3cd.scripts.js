"use strict";var crateAdminApp=angular.module("crateAdminApp",["ngRoute","sql","stats","common","overview","console","tables","cluster"]);crateAdminApp.config(["$routeProvider",function(a){a.when("/",{templateUrl:"views/overview.html",controller:"OverviewController"}).when("/console",{templateUrl:"views/console.html",controller:"ConsoleController"}).when("/tables",{templateUrl:"views/tables.html",controller:"TablesController"}).when("/tables/:table_name",{templateUrl:"views/tables.html",controller:"TablesController"}).when("/cluster",{templateUrl:"views/cluster.html",controller:"ClusterController"}).when("/cluster/:node_name",{templateUrl:"views/cluster.html",controller:"ClusterController"}).otherwise({redirectTo:"/"})}]),crateAdminApp.run(["ClusterState",function(){}]),angular.module("sql",[]).factory("SQLQuery",["$http","$location","$log","$q",function(a,b,c,d){function e(a,b,c){this.stmt=a,this.rows=[],this.cols=[],this.rowCount=[],this.duration=0,this.error={message:"",code:0},this.failed=c,void 0!=b.error||1==this.failed?(this.failed=!0,this.error=b.error):(this.rows=b.rows,this.cols=b.cols,this.rowCount=b.rowcount,this.duration=b.duration)}var f=b.search().prefix||"";return e.prototype.status=function(){var a="",b=this.stmt.split(" "),d=b[0].toUpperCase();return d in{CREATE:"",DROP:""}&&(d=d+" "+b[1].toUpperCase()),a=0==this.failed?d+" OK ("+(this.duration/1e3).toFixed(3)+" sec)":d+" ERROR ("+(this.duration/1e3).toFixed(3)+" sec)",c.debug("Query status: "+a),a},e.execute=function(b,g){var h={stmt:b};void 0!=g&&(h.args=g);var i=d.defer(),j=i.promise;return j.success=function(a){return j.then(function(b){a(b)}),j},j.error=function(a){return j.then(null,function(b){a(b)}),j},a.post(f+"/_sql",h).success(function(a){i.resolve(new e(b,a,!1))}).error(function(a,d){c.debug("Got ERROR response from query: "+b+" with status: "+d),0==d&&(a={error:{message:"Connection error",code:0}}),i.reject(new e(b,a,!0))}),j},e}]),angular.module("stats",["sql"]).factory("ClusterState",["$http","$timeout","$location","$log","SQLQuery",function(a,b,c,d,e){function f(a){var b=0,c=[0,0,0];for(var d in a){b++;for(var e=0;3>e;e++)c[e]=c[e]+a[d].os.load_average[e]}for(var e;3>e;e++)c[e]=c[e]/b;return c}var g=c.search().prefix||"",h={name:"--",status:"--",load:["-.-","-.-","-.-"]},i=5e3,j=function(){e.execute("select sum(number_of_shards) from information_schema.tables").success(function(a){var b=0;a.rowCount>0&&(b=a.rows[0][0]),e.execute('select count(*), "primary", state from stats.shards group by "primary", state').success(function(a){var c=0,d=0;for(var e in a.rows)1==a.rows[e][1]&&a.rows[e][2]in{STARTED:"",RELOCATING:""}?c=a.rows[e][0]:"UNASSIGNED"==a.rows[e][2]&&(d=a.rows[e][0]);h.status=b>c?"red":d>0?"yellow":"green"}).error(function(){h.status="--"})}).error(function(){h.status="--"}),b(j,i)},k=function(){a({method:"GET",url:g+"/_nodes/stats?all=true"}).success(function(a){h.name=a.cluster_name,h.load=f(a.nodes)}).error(function(){h.name="--",h.load=["-.-","-.-","-.-"]}),b(k,i)};return j(),k(),{data:h}}]),angular.module("common",["stats"]).controller("StatusBarController",["$scope","$log","$location","ClusterState",function(a,b,c,d){var e={green:"label-success",yellow:"label-warning",red:"label-danger","--":"label-default"};a.cluster_color_label="label-default",a.$watch(function(){return d.data},function(b){a.cluster_state=b.status,a.cluster_name=b.name,a.cluster_color_label=e[b.status],a.load1="-.-"==b.load[0]?b.load[0]:b.load[0].toFixed(2),a.load5="-.-"==b.load[1]?b.load[1]:b.load[1].toFixed(2),a.load15="-.-"==b.load[2]?b.load[2]:b.load[2].toFixed(2)},!0);var f=c.search().prefix||"";a.docs_url=f+"/_plugin/docs"}]).controller("NavigationController",["$scope","$location","ClusterState",function(a,b,c){var d={green:"",yellow:"label-warning",red:"label-danger","--":""};a.$watch(function(){return c.data},function(b){a.cluster_color_label_bar=d[b.status]},!0),a.isActive=function(a){return"/"==a?a===b.path():b.path().substr(0,a.length)==a},a.params=b.search().prefix?"?prefix="+b.search().prefix:""}]),angular.module("overview",["stats","sql","common"]).controller("OverviewController",["$scope","$log","$timeout","ClusterState","SQLQuery",function(a,b,c,d,e){function f(){e.execute('select table_name, sum(num_docs), "primary", relocating_node, avg(num_docs), count(*), state from stats.shards group by table_name, "primary", relocating_node, state order by table_name, "primary"').success(function(c){e.execute("select table_name, sum(number_of_shards) from information_schema.tables group by table_name").success(function(a){g(c,a)}).error(function(d){b.error("Error occurred on SQL query: "+d.error.message),g(c),a.available_data="--",a.records_unavailable="--"})}).error(function(c){b.error("Error occurred on SQL query: "+c.error.message),a.available_data="--",a.records_unavailable="--",a.replicated_data="--",a.records_total="--",a.records_underreplicated="--"});var d=c(f,i);a.$on("$destroy",function(){c.cancel(d)})}function g(b,c){var d=0,e=0,f=0,g={};for(var h in b.rows){var i=b.rows[h];void 0==g[i[0]]&&(g[i[0]]={total:0,replicated:-1,avg_docs:0,active_shards:0}),1==i[2]?(g[i[0]].total=i[1],g[i[0]].avg_docs+=i[4],g[i[0]].active_shards+=i[5]):"UNASSIGNED"!=i[6]&&(g[i[0]].replicated=i[1])}if(void 0!=c)for(var h in c.rows){var i=c.rows[h];void 0==g[i[0]]&&(g[i[0]]={total_shards:0}),g[i[0]].total_shards=i[1]}for(var j in g){d+=g[j].total,g[j].replicated>-1&&(e+=g[j].total-g[j].replicated);var k=g[j].total_shards-g[j].active_shards;k>0&&(f=k*g[j].avg_docs)}a.records_total=d,0==e?(a.records_underreplicated=0,a.replicated_data="100%"):(a.records_underreplicated=e.toFixed(0),a.replicated_data=(100-e/d*100).toFixed(2)+"%"),0==f?(a.records_unavailable=0,a.available_data="100%"):(a.records_unavailable=f.toFixed(0),a.available_data=(100-f/d*100).toFixed(2)+"%")}var h={green:"panel-success",yellow:"panel-warning",red:"panel-danger","--":"panel-default"};a.available_data="--",a.records_unavailable="--",a.replicated_data="--",a.records_total="--",a.records_underreplicated="--",a.cluster_state="--",a.cluster_color_class="panel-default",a.$watch(function(){return d.data},function(b){a.cluster_state=b.status,a.cluster_color_class=h[b.status]},!0);var i=5e3;f(),$("[rel=tooltip]").tooltip({placement:"top"})}]),angular.module("console",["sql"]).controller("ConsoleController",["$scope","$http","$location","SQLQuery","$log",function(a,b,c,d){a.statement="",a.rows=[],$("iframe").hide(),a.resultHeaders=[],a.renderTable=!1,a.error={},a.error.hide=!0;var e=Ladda.create(document.querySelector("button[type=submit]"));a.execute=function(){e.start(),d.execute(a.statement).success(function(b){e.stop(),a.error.hide=!0,a.renderTable=!0,a.resultHeaders=[];for(var c in b.cols)a.resultHeaders.push(b.cols[c]);a.rows=b.rows,a.status=b.status()}).error(function(b){e.stop(),a.error.hide=!1,a.renderTable=!1,a.error.message=b.error.message,a.status=b.status(),a.rows=[],a.resultHeaders=[]})}}]),angular.module("tables",["stats","sql","common"]).controller("TablesController",["$scope","$location","$log","$timeout","$routeParams","SQLQuery","roundWithUnitFilter","bytesFilter",function(a,b,c,d,e,f,g,h){function i(){f.execute("select table_name, sum(number_of_shards), sum(number_of_replicas) from information_schema.tables group by table_name").success(function(b){f.execute('select table_name, sum(num_docs), "primary", avg(num_docs), count(*), state, sum(size) from stats.shards group by table_name, "primary", state order by table_name, "primary"').success(function(c){a.renderSidebar=!0,j(b,c)}).error(function(){j(b)})}).error(function(){a.tables=[],a.table=angular.copy(p),a.selected_table="",a.renderSidebar=!1,a.renderSchema=!1});var b=d(i,l);a.$on("$destroy",function(){d.cancel(b)})}function j(b,c){var d={},i=[];for(var j in b.rows){var l=b.rows[j];void 0==d[l[0]]&&(d[l[0]]=angular.copy(p)),d[l[0]].shards_configured=l[1],d[l[0]].replicas_configured=l[2]}if(void 0!=c)for(var j in c.rows){var l=c.rows[j];void 0!=d[l[0]]&&(1==l[2]?(d[l[0]].records_total+=l[1],d[l[0]].avg_docs=l[3],d[l[0]].size+=l[6],d[l[0]].shards_active+=l[4],"STARTED"==l[5]&&(d[l[0]].shards_started=l[4])):"UNASSIGNED"!=l[5]?d[l[0]].records_replicated+=l[1]:d[l[0]].shards_missing+=l[4])}for(var q in d){var r=d[q];r.health="green",r.summary=g(r.records_total,1)+" Records ("+h(r.size)+") / "+r.replicas_configured+" Replicas / "+r.shards_configured+" Shards ("+r.shards_started+" Started)",r.shards_missing>0&&r.shards_active!=r.shards_configured?(r.records_unavailable=(r.shards_missing*r.avg_docs).toFixed(0),r.health="red",r.summary=g(r.records_unavailable,1)+" Unavailable Records / "+r.summary):r.shards_missing>0&&(r.health="yellow",r.shards_underreplicated=r.shards_configured,r.shards_missing=0,r.summary=r.shards_underreplicated+" Underreplicated Shards / "+r.summary),r.replicas_configured>0&&r.records_total!=r.records_replicated&&(r.records_underreplicated=r.records_total-r.records_replicated,"red"!=r.health&&(r.summary=r.records_underreplicated+" Underreplicated Records / "+r.summary),r.health="yellow"),r.health_panel_class=m[r.health],r.health_label_class=n[r.health],r.name=q,i.push(d[q])}return 0==i.length?(a.tables=i,a.table=angular.copy(p),a.selected_table="",a.renderSidebar=!1,a.renderSchema=!1,void 0):(i.sort(k),o=e.table_name&&void 0!=d[e.table_name]?e.table_name:i[0].name,a.tables=i,a.table=d[o],a.selected_table=o,f.execute("select column_name, data_type from information_schema.columns where table_name = '"+o+"'").success(function(b){a.renderSchema=!0,a.schemaHeaders=[];for(var c in b.cols)a.schemaHeaders.push(b.cols[c]);a.schemaRows=b.rows}).error(function(){a.renderSchema=!1}),void 0)}function k(a,b){return q[a.health]<q[b.health]?-1:q[a.health]>q[b.health]?1:0}var l=5e3,m={green:"panel-success",yellow:"panel-warning",red:"panel-danger","--":"panel-default"},n={green:"",yellow:"label-warning",red:"label-danger","--":""},o=e.table_name||"",p={name:"Tables (0 found)",summary:"",health:"--",health_label_class:"",health_panel_class:"",records_total:0,records_replicated:0,records_underreplicated:0,records_unavailable:0,shards_configured:0,shards_started:0,shards_active:0,shards_missing:0,shards_underreplicated:0,replicas_configured:0,size:0};a.isActive=function(a){return a===o};var q={green:2,yellow:1,red:0};i(),$("[rel=tooltip]").tooltip({placement:"top"}),a.toggleSidebar=function(){$("#wrapper").toggleClass("active")},a.routeParams=b.search().prefix?"?prefix="+b.search().prefix:""}]),angular.module("cluster",["stats","sql","common"]).controller("ClusterController",["$scope","$location","$log","$timeout","$routeParams","$http","$filter",function(a,b,c,d,e,f,g){function h(){f({method:"GET",url:o+"/_nodes/stats?all=true"}).success(function(b){a.renderSidebar=!0,i(b)}).error(function(){a.renderSidebar=!1,i({})});var b=d(h,j);a.$on("$destroy",function(){d.cancel(b)})}function i(b){function c(a,b){return p[a.health]<p[b.health]?-1:p[a.health]>p[b.health]?1:0}var d={},f=[];if(void 0!=b.nodes)for(var h in b.nodes){var i=b.nodes[h],j=i.name;if(void 0==d[j]&&(d[j]=angular.copy(n)),d[j].id=h,d[j].name=j,d[j].hostname=i.hostname,void 0!=i.attributes){var o=i.attributes.http_address.split(":");o.length>2&&(d[j].address=["http","//"+i.hostname,o[2]].join(":"))}d[j].heap={total:i.jvm.mem.heap_max_in_bytes,used:i.jvm.mem.heap_used_in_bytes,used_percent:i.jvm.mem.heap_used_percent},d[j].fs={free:i.fs.total.free_in_bytes,used:i.indices.store.size_in_bytes,free_percent:i.fs.total.free_in_bytes/i.fs.total.total_in_bytes*100,used_percent:i.indices.store.size_in_bytes/i.fs.total.total_in_bytes*100},d[j].heap.used_percent>=a.percentageLimitYellow&&(d[j].summary.push("Used HEAP "+g("number")(d[j].heap.used_percent,0)+"%"),d[j].health="yellow",d[j].heap.used_percent>=a.percentageLimitRed&&(d[j].health="red")),d[j].fs.used_percent>=a.percentageLimitYellow&&(d[j].summary.push("Used Disk "+g("number")(d[j].fs.used_percent,0)+"%"),d[j].health="yellow",d[j].fs.used_percent>=a.percentageLimitRed&&(d[j].health="red")),d[j].health_panel_class=k[d[j].health],d[j].health_label_class=l[d[j].health],f.push(d[j])}if(0==f.length)return a.nodes_list=f,a.node=angular.copy(n),a.selected_node="",a.renderSidebar=!1,void 0;var p={green:2,yellow:1,red:0};f.sort(c),m=e.node_name&&void 0!=d[e.node_name]?e.node_name:f[0].name,a.nodes=f,a.node=d[m],a.selected_node=m}var j=5e3;a.percentageLimitYellow=90,a.percentageLimitRed=98;var k={green:"panel-success",yellow:"panel-warning",red:"panel-danger","--":"panel-default"},l={green:"",yellow:"label-warning",red:"label-danger","--":""},m=e.node_name||"",n={name:"Cluster (0 Nodes)",id:"",summary:[],health:"--",health_label_class:"",health_panel_class:"",hostname:"",address:"",heap:{total:0,used:0,used_percent:0},fs:{free:0,used:0,free_percent:0,used_percent:0}},o=b.search().prefix||"";h(),a.isActive=function(a){return a===m},$("[rel=tooltip]").tooltip({placement:"top"}),a.toggleSidebar=function(){$("#wrapper").toggleClass("active")},a.routeParams=b.search().prefix?"?prefix="+b.search().prefix:""}]),angular.module("common").filter("capitalize",function(){return function(a){return a.substring(0,1).toUpperCase()+a.substring(1)}}).filter("truncate",function(){return function(a,b,c){return isNaN(b)&&(b=10),void 0===c&&(c="..."),a.length<=b||a.length-c.length<=b?a:String(a).substring(0,b-c.length)+c}}),angular.module("common").filter("roundWithUnit",["$filter",function(a){return function(b,c){return void 0==c&&(c=3),Math.abs(Number(b))>=1e9?a("number")(Math.abs(Number(b))/1e9,c)+" Billion":Math.abs(Number(b))>=1e6?a("number")(Math.abs(Number(b))/1e6,c)+" Million":a("number")(Math.abs(Number(b)),0)}}]).filter("bytes",function(){return function(a,b){if(0==a||isNaN(parseFloat(a))||!isFinite(a))return"-";"undefined"==typeof b&&(b=1);var c=["bytes","kB","MB","GB","TB","PB"],d=Math.floor(Math.log(a)/Math.log(1024));return(a/Math.pow(1024,Math.floor(d))).toFixed(b)+" "+c[d]}});