// HTMLView
// displays and retrieves info to and from the DOM 
import TaskRecord from './task-record.js';
//import {hash, copyToClipboard, copyInputToClipboard} from './trh.js'
export default class HTMLViews {
    constructor(tasksTrackingHelper){
        this._tasksTrackingHelper = tasksTrackingHelper;
        this._logCount = 0;
        this._displayingSettings = false;
        this.loadTemplateView();
        this.showCurrentGroup();
        this.updateRecordsGroupInfoView();
        this.domParser = new DOMParser();

        document.addEventListener(
            'DOMContentLoaded',
            (() => {
                this.updateEventHandlers();
            }).bind(this)
        );
        
    }
    get logCount () {return this._logCount;}
    set logCount (value) {this._logCount = value;}
    get tasksTrackingHelper () {
        return this._tasksTrackingHelper;
    }

    updateEventHandlers(){
        // Clicks
        let handlerList = [
            ["click", "#current-record-controls", this.handleCurrentRecordActions],
            ["click", "#log", this.handleLogActions],
            ["click", "#btn-settings", this.toggleSettingsView],
            ["click", "#btn-change-name", this.triggerRenameCurrentRecordsGroup],
            ["click", "#btn-rg-new", this.triggerNewRecordsGroup],
            ["click", "#btn-rg-del", this.triggerDeleteCurrentRecordsGroup],
            ["click", "#btn-rg-download", this.triggerDownloadRecordsGroup],
            ["click", "#settings-container", this.handleSettingsActions],
            ["click", "#tasks-info", this.handleTaskOutcomeChange],
            ["change", "#rg-list", this.triggerChangeSelectedRececordsGroup],
            ["change", "#entry", this.updateUnsavedRecord]
        ]
        handlerList.forEach(handlerDesc => { this.simpleAction( ...handlerDesc) }, this);
    }

    simpleAction(action, selector, fn){
        let element = document.querySelector(selector);
        element.addEventListener(
            action,
            (() => { 
                let o = this;
                o[fn.name](event);
            }).bind(this)
        );
    }
    handleTaskOutcomeChange(event){
        if (event.target.tagName == 'INPUT') {
            if (event.target.id.match(/\d+-\d+/).length > 0) {
                this.setOutcome(event.target.id);
            }
        }

    }

    copyRecord(id){
        console.log("trying to copy " + id);
        this.copyToClipboard(
            document.getElementById(id).innerText
        )

    }
    handleLogActions(event){
        let elementID = event.target.id ;
        let arr       = elementID.split("-");
        let fnList    = new Map();

        fnList.set("dr",this.deleteRecordAndView);
        fnList.set("chk",this.markRecordTrackedStatus);
        fnList.set("copy", this.copyRecord);
        let f = fnList.get(arr[0]);
        if (f){
            let h = this;
            h[f.name](arr[1]);
        }
    }
    markRecordTrackedStatus(id){
        let status = document.getElementById("chk-"+id).checked;
        this._tasksTrackingHelper._selectedRecordsGroup.setTrackedStatus(id, status);
        this._tasksTrackingHelper.storeSelectedRecordsGroup();
        this.updateRecordBackground(id);
    }

    updateRecordBackground(id){
        let status = document.getElementById("chk-"+id).checked;
        let record = document.getElementById(id);
        if (status == true){
            record.classList.remove("record-untracked");
            record.classList.add("record-tracked");
        } else {
            record.classList.remove("record-tracked");
            record.classList.add("record-untracked");
        }

    }

    deleteRecordAndView(id){
        console.log("dr: "+id)
        let text = document.getElementById(id).innerText;
        let ok   = confirm(
            "Are you sure you want to delete:\n" + 
            "================================\n" + text
            );
        if(ok){
            this._tasksTrackingHelper._selectedRecordsGroup.deleteRecord(id);
            this._tasksTrackingHelper.storeSelectedRecordsGroup();
            //this.showCurrentGroup();
            let lc = document.getElementById("log");
            let rc = document.getElementById("rc-"+id);
            lc.removeChild(rc);
            let recordsCount = 
                this._tasksTrackingHelper.
                    _selectedRecordsGroup.records.length; 
            let cLabels = document.querySelectorAll(".record-container > div.record-header > h3");
            if (cLabels){
                let l = cLabels.length;
                for (let index = 0 ; index < l; index++) {
                    cLabels[index].innerText = l - index;
                }
                this._logCount = l ;
            }
            

        }
    }

    handleSettingsActions (event) {
        let tid = event.target.id;
        switch (tid) {
            case "template-save":
                this.saveTemplateChanges();
                break;
            case "template-new":
                this.createNewRecordsTemplate();
                break;
            case "template-delete":
                this.deleteSelectedRecordsTemplateAndView();
                break;
            default:
                break;
        }

    }

    createNewRecordsTemplate(){
        this._tasksTrackingHelper.addTemplate(
            this.tasksTrackingHelper.generateDefaultTemplateText()
        );
        this.refreshSettingsViews();
        this.loadTemplateView();
    }
    refreshSettingsViews(){
        document.getElementById("template-text").value =
            this._tasksTrackingHelper.selectedRecordsTemplate.templateText;
        
        this.loadTemplatesSelect();
        document.getElementById("templates-select").value =
            this._tasksTrackingHelper.selectedRecordsTemplate.name;

    }
    deleteSelectedRecordsTemplateAndView(){
        let tn = this._tasksTrackingHelper.selectedRecordsTemplate.name;
        let ok = confirm(`Are you sure you want to delete the template ${tn}?`)
        if (ok){
            this._tasksTrackingHelper.deleteSelectedRecordsTemplate();
            this.loadTemplateView();
            this.refreshSettingsViews();
        }
    }
    loadTemplateView(){
        this.createInputFields();
        this.createTaskViews();
        this.showUnsavedRecord();
    }
    
    saveTemplateChanges() {
        let tt = document.getElementById("template-text").value;
        this._tasksTrackingHelper.changeCurrentRecordsTemplate(tt);
        this.loadTemplatesSelect();
        this.loadTemplateView();
    }


    updateTemplatesSelect(templateName){
        let tth = this._tasksTrackingHelper;
        tth.selectedRecordsTemplate = templateName;
        let t   = tth.selectedRecordsTemplate;
        document.getElementById("template-text").value = t.templateText;
        tth._selectedRecordsGroup._type = t.name;
        tth.storeSelectedRecordsGroup();
        this.loadTemplateView();
    }

    // Records Group Section
    updateRecordsGroupInfoView(){
        this.updateRecordsGroupList();
        this.updateSelectedGroupInfo();

    }
    updateRecordsGroupList(){
        let rgl = document.getElementById("rg-list");
        let options = this._tasksTrackingHelper._recordsGroupList
            .map( n => `<option value="${n}">${n}</option>` );
        let html = options.join("")
        rgl.innerHTML = "";
        rgl.innerHTML = html;
    }
    updateSelectedGroupInfo(){
        let rgn = document.getElementById("rg-selected-name");
        let n   = this._tasksTrackingHelper._selectedRecordsGroup.name;
        rgn.innerText = n;
        let rgl = document.getElementById("rg-list");
        rgl.value = n;
    }
    triggerRenameCurrentRecordsGroup(){
        let rg = this._tasksTrackingHelper._selectedRecordsGroup;
        let rgNameDisplay = document.getElementById("rg-selected-name");
        let changeNameBtn = document.getElementById("btn-change-name");
        if (!rgNameDisplay.isContentEditable){
            rgNameDisplay.contentEditable = true;
            rgNameDisplay.focus();
            changeNameBtn.innerHTML="&#x1f4be;"; // utf8 floppy disk
        } else {
            changeNameBtn.innerHTML="&#x1f589;"; // utf8 LOWER LEFT PENCIL
            rgNameDisplay.contentEditable = false;
            let newName = rgNameDisplay.innerText;
            let oldName = rg.name;
            if (newName != oldName) {
                this._tasksTrackingHelper.renameCurrentRecordsGroup(newName);
                this.updateRecordsGroupList();
                this.updateSelectedGroupInfo();
            }
        }
    }
    triggerDownloadRecordsGroup(){
        let rg = this._tasksTrackingHelper._selectedRecordsGroup;
        let blob =  rg.toBlob();
        let  objURL = window.URL.createObjectURL(blob);
        let element = document.createElement("a");
        element.href = objURL;
        element.download = `${rg.name} ${rg.date}`
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    triggerNewRecordsGroup(){
        let name = "RG "+ new Date().toISOString().slice(0,19);
        this._tasksTrackingHelper.setupNewRecordsGroup( name, 'Default');
        this.updateRecordsGroupList();
        this.updateSelectedGroupInfo();
        this.showCurrentGroup()
    }

    triggerDeleteCurrentRecordsGroup(){
        let ok = confirm("Are you sure you want to delete the Records Group:\n"
            + this._tasksTrackingHelper._selectedRecordsGroup.name);
        if (ok) {
            this._tasksTrackingHelper.deleteCurrentRecordsGroup();
            this.updateRecordsGroupList();
            this.updateSelectedGroupInfo();
            this.showCurrentGroup()
        }
    
    }

    triggerChangeSelectedRececordsGroup(event){
        let allDaltaSaved = this.isCurrentFormEmpty();
        let ok = true;
        if (!allDaltaSaved) {
            ok = confirm("There is unsaved data, continue?");
        }
        if (ok) {
            let sg = event.target.value;
            this._tasksTrackingHelper.changeSelectedRecordsGroup(sg);
            this.updateRecordsGroupList();
            this.updateSelectedGroupInfo();
            this.showCurrentGroup()
            this.loadTemplateView();

        }

    }

    createInputFields() {
        this.tasksTrackingHelper.selectedRecordsTemplate.updateInputIDs().then((ids) => {
            let inputFieldNames = this.tasksTrackingHelper.selectedRecordsTemplate.inputFieldNames;
            let fieldsContainer = document.getElementById("in-fields");
            fieldsContainer.innerHTML = "";
            //let ids = this.tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
            inputFieldNames.forEach((n, index) => {
                fieldsContainer.innerHTML +=
                    `<div class="input-field-container">
                        <label for="${ids[index]}" class="input-field-label">${n}</label>
                        <input class='input-field' id="${ids[index]}" type="text">
                    </div>
                    <button tabindex="-1" class='copy' 
                    onclick="copyInputToClipboard('${ids[index]}')">&#x2398</button>`
            });
        }) ;
    }

    createTaskViews(){
        let tasks = this._tasksTrackingHelper.selectedRecordsTemplate.tasks;
        const infoDiv = document.getElementById("tasks-info");
        infoDiv.innerHTML = "";
        tasks.forEach(
            (task, index) => {
                let td = task.taskDescription;
                infoDiv.innerHTML += `<div id='task-${index}'  class='task'>${td}</div>`;
                infoDiv.innerHTML += `<div class="outcomes-container" id="oc-${index}"></div>`;
                task.taskOutcomes.forEach(
                    (taskOutcome, outcomeIndex) => {
                        let taskOptionID = index + "-" + outcomeIndex;
                        let html =
                            `<input class='radio-option' type="radio" 
                            id=${taskOptionID} name="tos-${index}" value=${taskOutcome}>
                            <label class='to-unchecked' for="${taskOptionID}">${taskOutcome}</label>`;
                        let oc = document.getElementById('oc-' + index);
                        oc.innerHTML += html;
                    });
                
            }
        );
        this.setDefaults();
    }

    toggleSettingsView(){
        this._displayingSettings = (this._displayingSettings) ? false: true; //toggle
        let settingsContainer = document.getElementById("settings-container");
        if (this._displayingSettings){
            let templateText = this._tasksTrackingHelper.selectedRecordsTemplate.templateText;
            settingsContainer.style.height = "200px";
            settingsContainer.innerHTML = `
                    <textarea name="" id="template-text" ></textarea>
                    <div id="settings-controls">
                     <select name="templates-select" id="templates-select"></select>
                     <button class="settings-btn" id="template-new">New</button>
                     <button class="settings-btn" id="template-save">Save</button>
                     <button class="settings-btn" id="template-delete">Delete</button>
                    </div>
                    `;
            this.loadTemplatesSelect();
            this.checkForElement('template-text').then(tt => tt.value = templateText);
            let selecthandler = (event) => {
                console.log("fired!")
                console.log(event.target.value);
                this.updateTemplatesSelect(event.target.value);
            }
            selecthandler.bind(this);
            this.checkForElement('templates-select').then( templatesSelect =>
                templatesSelect.onchange = selecthandler

            );
        } else {
            settingsContainer.style.height = "0px";
            settingsContainer.innerHTML = "";
        }
    }

    loadTemplatesSelect(){
        this.checkForElement("templates-select").then(
            templatesSelect => {
                let rtOptions = Array.from(this._tasksTrackingHelper._recordsTemplates)
                    .map(rt => {
                        let tn = rt[1].name;
                        return `<option value="${tn}">${tn}</option>`;
                    });
                templatesSelect.innerHTML = rtOptions.join("");
                templatesSelect.value = 
                    this._tasksTrackingHelper.selectedRecordsTemplate.name;

            }
        );
    }

    async animateGrow(element, size, duration){
        let d = (duration/1000) * 60;
        for (let index = 0; index < d; index++) {
            requestAnimationFrame(() => {
                let h =  size / d * index ;
                element.style.height =  h + "px";
            });
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }

    setOutcome(toid) {
        this._tasksTrackingHelper.updateSelectedTaskOutcome(...toid.split("-"));
        let taskID = toid.split("-")[0];
        let tasks = this._tasksTrackingHelper._selectedRecordsTemplate.tasks;
        tasks[taskID].taskOutcomes.forEach((to, i) => {
            toid = taskID + "-" + i;
            let radioOption = document.getElementById(toid);
            if (radioOption.checked) {
                radioOption.labels[0].className = "to-checked";
                document.getElementById("task-" + taskID).innerHTML = tasks[taskID].taskDescription + " " + to;
            } else {
                radioOption.labels[0].className = "to-unchecked";
            }
        });
    }

    setDefaults() {
        console.log("Setting default outcomes");
        let tasks = this._tasksTrackingHelper._selectedRecordsTemplate.tasks;
        tasks.forEach((t, i) => {
            var firstTaskOptionId = i + "-0";
            document.getElementById(firstTaskOptionId).checked = true;
            this.setOutcome(firstTaskOptionId);
        });
    }

    getTaskInfo(taskID) {
        return document.getElementById("task-" + taskID).innerText;
    }
    
    getCurrentInfo() {
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
        let inputFieldNames = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldNames;
        let tasks = this._tasksTrackingHelper.selectedRecordsTemplate.tasks;
        let info = "";
        ids.forEach(
            (id, index) => {
                var v = document.getElementById(id).value
                info += `${inputFieldNames[index]}: ${v}\n`
            }
        );
        tasks.forEach((_, index) => {
            info += this.getTaskInfo(index) + "\n";
        });
        info += "Comments:\n" + document.getElementById("comments-text").value + "\n";
        return info
    }

    isCurrentFormEmpty () {
        let hasFilledFields = false;
        let hasComments = (document.getElementById("comments-text").value > 0);
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;

        for (var index = 0, n = ids.length; index < n; index++) {
            var inField = document.getElementById(ids[index]);
            if (inField.value.length > 0) {
                hasFilledFields = true;
                break;
            }
        }
        return !hasFilledFields && !hasComments;
    }

    showUnsavedRecord(){
        let tth = this._tasksTrackingHelper;
        tth.loadUnsavedRecord();
        let show = (ids) => {
            let fieldsInfo = tth._unsavedRecord._fieldsInfo;
            try {
                ids.forEach((elementId, index) => {
                    this.checkForElement(elementId).then(
                        (element) => {
                            element.value = fieldsInfo[index][1]
                        }
                    )
                    
                },this);
            } catch (error) {
                console.log(error)
            }

            try {
                tth._taskOutcomesSelected.forEach(
                    (outcomeIndex, taskIndex) => {
                        let toid = taskIndex + "-" + outcomeIndex;
                        let outcomeElement = document.getElementById(toid);
                        outcomeElement.checked = true;
                        this.setOutcome(toid);

                    }
                    , this);
                
            } catch (error) {
                console.log(error)
            }
            try {
                document.getElementById("comments-text").value = tth._unsavedRecord._comments;
                
            } catch (error) {
                console.log(error)
                
            }

        }
        show.bind(this);

        tth.selectedRecordsTemplate.updateInputIDs().then(show);
        
    }

    updateUnsavedRecord(event){
        let target = event.target
        let parent = event.target.parentNode;
        let tth = this.tasksTrackingHelper;
        switch (parent.className) {
            case "input-field-container":
                let index = tth._selectedRecordsTemplate
                    ._inputFieldIDs.indexOf(target.id);
                let value =  document.getElementById(target.id).value;
                let fieldName = tth._selectedRecordsTemplate._inputFieldNames[index];
                tth._unsavedRecord._fieldsInfo[index] = [fieldName,value];
                break;

            case "outcomes-container":
                let arr = target.id.split("-");
                tth.updateSelectedTaskOutcome(...arr);
                break;

            case "comments-container":
                tth._unsavedRecord._comments = 
                    document.getElementById(target.id).value;
                break;
            default:
                break;
        }
        tth.storeUnsavedRecord();
        //let parent
        //this._tasksTrackingHelper.storeUnsavedRecord();
    }

    handleCurrentRecordActions(event){
        switch (event.target.id) {
            case 'btn-copy-current':
                this.copyToClipboard(this.getCurrentInfo());
                break;
            case 'btn-track-current':
                this.trackCurrent();
                break;
            default:
                break;
        }

    }

    trackCurrent() {
        console.log("Tracking")
        let hasEmptyFields = false;
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
        let taskRecordsGroup = this._tasksTrackingHelper._selectedRecordsGroup;
        let selectedTemplate = this._tasksTrackingHelper._selectedRecordsTemplate;

        for (var index = 0, n = ids.length; index < n; index++) {
            var inField = document.getElementById(ids[index]);
            if (inField.value.length == 0) {
                inField.focus();
                hasEmptyFields = true;
                break;
            }
        }

        if (!hasEmptyFields) {
            var info = this.getCurrentInfo();
            // Create fields Array
            let fieldsInfo = ids.map((id, index) => 
                [selectedTemplate.inputFieldNames[index], 
                document.getElementById(id).value]);

            // Create tasks and Outcomes Array
            let tasksAndOutcomes = this._tasksTrackingHelper._taskOutcomesSelected
                .map(
                    (outcomeIndex, taskIndex) => {
                        let tasks = selectedTemplate.tasks;
                        let desc = tasks[taskIndex].taskDescription
                        let outcome = tasks[taskIndex].taskOutcomes[outcomeIndex]
                        return [desc, outcome];
                    }
                );

            let comments = document.getElementById("comments-text").value;
            var tr = new TaskRecord(fieldsInfo, tasksAndOutcomes, comments, "");
            taskRecordsGroup.addRecord(tr);
            this._tasksTrackingHelper.storeSelectedRecordsGroup();
            tr.recalculateID().then(() => this.showInLog(tr));
            this.clearFields();
            this._tasksTrackingHelper.storeUnsavedRecord(); // After cleared
        }
    }

    showInLog(taskRecord) {
        let logDiv = document.getElementById("log");
        this._logCount += 1;
        let id = taskRecord.id;
        let record =
            `<div class='record-container' id='rc-${id}'>
                    <button class='copy' id='copy-${id}'>&#x2398;</button>
                    <div class='record-header'> 
                        <h3 class='count'>${this.logCount}</h3> 
                        <label for='chk-${id}' class='small-label'>Tracked</label> 
                        <input id='chk-${id}' type='checkbox'/>
                        <button class='delete-btn' id='dr-${id}'>&#x1F5D1;</button>
                    </div>
                    <div id='${id}' class='record'>${taskRecord.getInfo()}</div> 
            </div>`;
        let element =  this.domParser.parseFromString(record.toString(), 'text/html');
        logDiv.prepend(element.body.firstChild);
        let status = taskRecord.tracked;
        this.checkForElement('chk-'+id).then(el => el.checked = status);
        this.checkForElement(id).then(el => this.updateRecordBackground(el.id));
        
    }

    showCurrentGroup() {
        let logDiv = document.getElementById("log").innerHTML = "";
        let taskRecords = this._tasksTrackingHelper._selectedRecordsGroup.records;
        this._logCount = 0;
        for (let index = 0; index < taskRecords.length; index++) {
            const tr = taskRecords[index];
            tr.recalculateID().then( (() =>  this.showInLog(tr)).bind(this));
        }
    }

    clearFields() {
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
        ids.forEach(id => document.getElementById(id).value = "");
        this.setDefaults();
        this._tasksTrackingHelper.resetUnsavedRecord();
        document.getElementById("comments-text").value = "";
    }
    // Copy current info to clipboard
    // copyInfo
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(function () {
            /* clipboard successfully set */
            console.log("Text copied");
        }, function () {
            /* clipboard write failed */
            console.log("Text not copied");
        });

    }
    async checkForElement(id) {
        let el = null;
        do {
            await new Promise(resolve => requestAnimationFrame(resolve));
            el = document.getElementById(id);
        } while (el === null);
        return el;
    }

}

