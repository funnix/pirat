var QW = QW || {};
QW.Modules = QW.Modules || {};


QW.Modules.Tabs = {};


QW.Modules.Tab = function(options) {

    this.constructor(options);

}


//static function
QW.Modules.Tab.init = function() {

    $('#tabs').w2tabs({
        name: 'tabs',
        active: 'tab1',
        tabs: [],
        onClick: function(event) {
            var tabId = event.target;
            console.log("EVEBT:", event);
            if (typeof QW.Modules.Tabs[tabId].activate == "function") QW.Modules.Tabs[tabId].activate();
            if (typeof QW.Modules.Tabs[tabId].tabActivation == "function") QW.Modules.Tabs[tabId].tabActivation();
        },
        onClose: function(event) {
            if (QW.Modules.Tabs[event.object.id] !== undefined) {
                QW.Modules.Tabs[event.object.id].closeTab();
            }

        }
    });

}

QW.Modules.Tab.activateTab = function(id) {

    if (QW.Modules.Tabs[id] == undefined) return;

    QW.Modules.Tabs[id].activate();

};
QW.Modules.Tab.exists = function(id) {

    if ($('#tabHolder').find('[data-tab="' + id + '"]').length == 1) {
        return true;
    } else {
        return false;
    }

}


// Prototype...
QW.Modules.Tab.prototype = {

    id: null,
    name: null,
    type: null,
    contentObj: null,


    constructor: function(options) {

        this.id = options.id;
        this.name = options.name;
        this.type = options.type;
        this.closable = (options.closable !== undefined) ? options.closable : true;
        this.icon = options.icon;

        QW.Modules.Tabs[this.id] = this;

        var that = this;
        var icon = '<i class="' + this.icon + '"></i> ';

        w2ui.tabs.add({ id: this.id, caption: icon + this.name, closable: this.closable });

        // Depending on the type of tab...load the content
        this.generateHTML();
        that.activate();


    },

    activate: function(params) {

        //Tab aktivieren (visuell)
        w2ui.tabs.select(this.id);
        if (this.id == "welcome") {} else {
            w2ui.sidebar.select(this.id);
        }

        /** NEW AND WORKING BETTER THAN EVER */
        // Move the content away from visible viewport!
        // With enough space for a potential existing menu.....(on the left....)
        var leftMenuOffset = $('div[data-tab]').parent().offset().left;
        var currentWidth = parseInt($('div[data-tab]').width(), 10) + leftMenuOffset;
        // Preserve width!!!!!!!!
        $('div[data-tab]').css("left", (-1 * currentWidth) + "px").css("right", currentWidth + "px");
        $('div[data-tab="' + this.id + '"]').css("left", 0).css("right", 0);

        // Setzen der MenuId in der Headline...
        // NICHT beim Initial load
        if (QW.Base.initialLoad === false) {
            if (this.id == "welcome") {
                QW.Base.clearGetParams();
            } else {
                QW.Base.setMenuId(this.id);
            }
        }
        // if provided...
        if (this.contentObj && (typeof this.contentObj.tabActivation == "function")) {
            this.contentObj.tabActivation(params);
        } else {
            // Set the active module for the backend!!!!
            socket.emit("user.State/active", { module: "none", id: 0 }, function(err) { if (err) console.log(err) });
        }

    },



    /**
     * Generate HTML tab and content area
     *
     */
    generateHTML: function() {

        var that = this;
        var content = '<div data-tab="' + this.id + '" style="visibility:visible;position:absolute;bottom:0;top:0px;left:0;right:0;"></div>';
        $('#tabContent').append(content);


    },

    setContentObj: function(contentObj) {

        this.contentObj = contentObj;

    },

    setContent: function(html) {

        $('#tabContent').find("div[data-tab='" + this.id + "']").html(html);

    },

    appendContent: function(html) {

        $('#tabContent').find("div[data-tab='" + this.id + "']").append(html);

    },


    closeTab: function() {

        // Clear something?!
        if (this.contentObj && (typeof this.contentObj.tabClose == "function")) {
            this.contentObj.tabClose();
        }

        w2ui.tabs.remove(this.id);

        $('#tabContent').find("div[data-tab='" + this.id + "']").remove();
        delete QW.Modules.Tabs[this.id];

        // Select the next tab in row....// rückwärts....
        for (var x in QW.Modules.Tabs) {
            QW.Modules.Tabs[x].activate();
            return;
        }

        // Kein Tab mehr aktiv....
        // Set the active module for the backend!!!!
        socket.emit("user.State/active", { module: "none", id: 0 }, function(err) { console.log(err) });

    }


};