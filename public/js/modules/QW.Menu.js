/**
 * Applikations-Menü
 * 
 * Baut sich auf, entsprechend der Rechte des Users.
 */
QW.Menu = {


    init: function() {

        var that = this;

        this.initEventListeners();

        this.nodes = [
            // ID 0 => Arbeitsblätter		
            { id: 'sheets', text: 'Übersicht', icon: 'fa fa-table', group: true, expanded: true, nodes: [] },
            // ID 1 => Auswertungen oder spezielle Module
            { id: 'dashboards', text: 'Auswertungen', icon: 'fa fa-dashboard', group: true, expanded: true, nodes: [] },
            // ID 2 => Meilensteinplanungen
            { id: 'milestones', text: 'Meilensteinplanungen', icon: 'fa fa-tasks', group: true, expanded: true, nodes: [] },
            // ID 3 => Konfiguration
            { id: 'settings', text: 'Aktionen', icon: 'fa fa-cogs', group: true, expanded: true, nodes: [] }
        ];

        this.initSidebar();
        this.refreshMenu();

    },


    initSidebar: function() {

        if (w2ui['sidebar'] !== undefined) w2ui["sidebar"].destroy();

        $('#sidebarTop').w2sidebar({
            name: 'sidebar',
            nodes: this.nodes,
            onClick: function(event) {
                console.log("AUS EVENT:", event);
                QW.Menu.openItem(event.object.id);
            }
        });

    },

    openItem: function(menuId, additionalParams) {
        console.log("WAS GEHT HIER ?", menuId, additionalParams);

        var data = w2ui.sidebar.get(menuId);
        console.log("DATA", data);
        if (data == null) return;

        var id = menuId;
        var module = data.module;
        var itemParams = data.params || [];
        var name = data.text;
        var icon = data.icon;

        if (additionalParams) {
            for (var x in additionalParams) {
                itemParams.push(additionalParams[x]);
            }
		}
		
        

        console.log(" BIS HIE Komme ich noch", module, QW.Modules);
        socket.emit("main/" + module, module, function(data) {
            console.log("????????????", data)
            $('#tabContent').html(data);
        })
        if (module == undefined) return;
        if (QW.Modules[module] == undefined) return;

        var params = ['div[data-tab="' + id + '"]'];
        console.log("PARAMS:", params);
        for (var x in itemParams) {
            params.push(itemParams[x]);
        }

        // Is this tab already opened?!
        if (QW.Modules.Tabs[id] !== undefined) {
            QW.Modules.Tabs[id].activate(itemParams);
        } else {

            new QW.Modules.Tab({ id: id, name: name, module: module, icon: icon });

            // set the URL 
            QW.Base.setGetParams({ menuId: menuId }, true);


            var obj = Constructor(QW.Modules[module], params);
            QW.Modules.Tabs[id].setContentObj(obj);

        }

        if (typeof QW.Modules.Tabs[id].tabActivation == "function") QW.Modules.Tabs[id].tabActivation();

    },


    clear: function() {

        var sheets = w2ui.sidebar.get("sheets").nodes;
        for (var x in sheets) {
            w2ui.sidebar.remove(sheets[x].id);
        }
        var dashboards = w2ui.sidebar.get("dashboards").nodes;
        for (var x in dashboards) {
            w2ui.sidebar.remove(dashboards[x].id);
        }
        var milestones = w2ui.sidebar.get("milestones").nodes;
        for (var x in milestones) {
            w2ui.sidebar.remove(milestones[x].id);
        }
        var settings = w2ui.sidebar.get("settings").nodes;
        for (var x in settings) {
            w2ui.sidebar.remove(settings[x].id);
        }

    },


    refreshMenu: function(callback) {

        // console.log("...refresh menu")
        this.initSidebar();
        // Remove all children from the existing main nodes...
        this.clear();
        console.log("???????????????????????", this);
        w2ui['sidebar'].add("sheets", { id: 'appView1', module: 'AppView1', text: 'Anwendungs-Details', icon: 'fa fa-cube' });
        w2ui['sidebar'].add("settings", { id: 'appView', module: 'AppView', text: 'Anwendungs-Details', icon: 'fa fa-cube' });
        // async.waterfall([

        //         function(next) {
        //             // Sheets holen
        //             // socket.emit("admin.Sheets/list", {}, function(err, sheets) {

        //             //     for (var x in sheets) {

        //             //         var s = sheets[x];
        //             //         // Keine Leserechte auf das Sheet
        //             //         if (QW.Base.appState.rights.indexOf("sheet_read_" + s.id) == -1) continue;

        //             //         if (sheets[x].type == "milestones") {

        //             //             // Meilensteinplanungsansicht
        //             //             w2ui['sidebar'].add("milestones", { id: 'milestone_' + s.id, module: 'Milestoneplan', params: { id: 'milestone_' + s.id, dbId: s.id }, text: 'Plan: ' + s.name, icon: 'fa fa-list' });
        //             //             if (QW.Base.appState.rights.indexOf("sheet_write_" + s.id) == -1) continue;
        //             //             w2ui['sidebar'].add("milestones", { id: 'sheet_' + s.id, params: { id: 'sheet_' + s.id, dbId: s.id }, hidden: true, module: 'Sheet', view: 'default', text: s.name, icon: 'fa fa-pencil' });

        //             //         } else {

        //             //             w2ui['sidebar'].add("sheets", { id: 'sheet_' + s.id, params: { id: 'sheet_' + s.id, dbId: s.id }, module: 'Sheet', view: 'default', text: s.name, icon: 'fa fa-table' });
        //             //         }
        //             //     }

        //             //     // Wenigstens EIN Sheet, mit write Rechten, dann auch der Papierkorb sichtbar!
        //             //     if (QW.Helper.hasRightLike("sheet_write_[0-9]*")) {
        //             //         w2ui['sidebar'].add("sheets", { id: 'trashCan', params: { id: 'trashCan' }, module: 'TrashCan', text: 'Papierkorb', icon: 'fa fa-trash' });
        //             //     }


        //             //     next();
        //             // })
        //         },

        //         // Andere Menüpunkte
        //         function(next) {
        //             w2ui['sidebar'].add("settings", { id: 'appView', module: 'AppView', text: 'Anwendungs-Details', icon: 'fa fa-cube' });

        //             if (QW.Helper.hasRight("sheet_read_1") && QW.Helper.hasRight("sheet_read_2") && QW.Helper.hasRight("see_raw_data_import_stats")) {
        //                 w2ui['sidebar'].add("settings", { id: 'appView', module: 'AppView', text: 'Anwendungs-Details', icon: 'fa fa-cube' });
        //             }

        //             if (QW.Base.appState.rights.indexOf("see_raw_data_import_stats") !== -1) {
        //                 w2ui['sidebar'].add("settings", { id: 'importedData', module: 'ImportedData', text: 'Importierte Daten', icon: 'fa fa-info' });
        //             }

        //             // Bankserien-Infos
        //             if (QW.Base.appState.rights.indexOf("sheet_read_2") !== -1) {
        //                 w2ui['sidebar'].add("dashboards", { id: 'bankinfo_1', module: 'BankInfo', text: 'Bank-Information', icon: 'fa fa-info' });
        //             }
        //             // INFOS zu Anwendungen
        //             if (QW.Base.appState.rights.indexOf("sheet_read_1") !== -1) {
        //                 w2ui['sidebar'].add("dashboards", { id: 'dashboard_1', params: { id: "dashboard_1", dbId: 1 }, module: 'Dashboard', text: 'Status B-Portfolio', icon: 'fa fa-bar-chart' });
        //             }


        //             // Konfiguration....
        //             // w2ui['sidebar'].add("settings",{ id: 'tutorials', module: "Tutorials", text: 'Tutorials', icon: 'fa fa-video-camera'});
        //             w2ui['sidebar'].add("settings", { id: 'onlinehelp', module: "OnlineHelp", text: 'OnlineHelp', icon: 'fa fa-question-circle' });

        //             if (QW.Base.appState.rights.indexOf("sheet_write_3") !== -1) {
        //                 w2ui['sidebar'].add("settings", { id: 'logpointdelta', module: "LogpointDelta", text: 'Meldepunkt-Delta', icon: 'fa fa-bolt' });
        //             }


        //             if (QW.Base.appState.rights.indexOf("show_changelog") !== -1) {
        //                 w2ui['sidebar'].add("settings", { id: 'changes', module: "Changes", text: 'Änderungen', icon: 'fa fa-edit' });
        //             }

        //             // CIB-Tools
        //             if (QW.Base.appState.rights.indexOf("cib_tools") !== -1) {
        //                 w2ui['sidebar'].add("settings", { id: 'cib', module: "CIB", text: 'CIB-Tools', icon: 'fa fa-cubes' });
        //             }

        //             // If migtabs reader...
        //             if (QW.Base.appState.rights.indexOf("migtabs_read") !== -1) {
        //                 w2ui['sidebar'].add("settings", { id: 'migtabs', module: 'MigTabs', icon: 'fa fa-reorder', text: 'MigTabs', type: 'migtabs' });
        //             }

        //             // Irgend etwas mit "config_" oder irgendein sheet, welches Konfiguriert werden darf...
        //             if (QW.Helper.hasRightLike("sheet_config_[0-9]*") || QW.Helper.hasRightLike("config_*")) {
        //                 w2ui['sidebar'].add("settings", { id: 'config', text: 'Konfiguration', icon: 'fa fa-cogs', module: 'Configuration' });
        //             }

        //             next();
        //         }

        //     ],
        //     function() {

        //         if (typeof callback == "function") callback();

        //     });



        /*setTimeout(function(){
        	w2ui['sidebar'].add('sheets', [{ id: 'sheet_6', dbId: 6, type:'sheet', view: 'default', text: '34643636', icon: 'fa fa-table'}]);
        },2000);
        */

    },

    initialLoad: function() {

        // If tabs is ready....load the tab....
        if ($('#tabContent').height() !== 0) {
            this.openItem(QW.Base.urlParams["menuId"]);
            QW.Base.initialLoad = false;
        } else {
            setTimeout(function() {
                QW.Menu.initialLoad();
            }, 100);
        }

    },

    // Listener
    initEventListeners: function() {

    }


}



var Constructor = function() {
    var tempConstructor = function() {};
    return function(ctor, args) {
        tempConstructor.prototype = ctor.prototype;
        var instance = new tempConstructor();
        ctor.prototype.constructor.apply(instance, args);
        return instance;
    }
}();