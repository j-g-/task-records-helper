//
// Copyright (c) 2020, J. Garcia <0x4a.dev at gmail.com> 
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the copyright holder nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

// Main Object Class
// Defines the main general variables and functions to start the app
class TasksTrackingHelper {

    constructor(){
        this._recordsTemplates = this.loadTemplates();
        this._selectedRecordsTemplate = this.loadSelectedTemplate();
        this._recordsGroupList = this.loadRecordsGroupList();
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
        this._taskOutcomesSelected = []
        this._unsavedRecord =  null;
        //this.loadUnsavedRecord();
        this._htmlViews = new HTMLViews(this);
    }

    storeUnsavedRecord(){
        this.localSave("unsavedRecord", this._unsavedRecord);
        this.localSave("unsavedOutcomes", this._taskOutcomesSelected);
    }

    resetUnsavedRecord(){
        this._unsavedRecord._fieldsInfo.forEach(field => field[1] ="");
        this._unsavedRecord._comments ="";
        this._taskOutcomesSelected = [];
        this._selectedRecordsTemplate.tasks
            .forEach(() => this._taskOutcomesSelected.push(0), this);
        this.storeUnsavedRecord();
    }

    loadUnsavedRecord(){
        let recordObj = this.loadLocalJSON("unsavedRecord");
        let comments = (recordObj) ? recordObj._comments : "";
        let record = new TaskRecord([],[],comments,"");
        let oldFieldsInfo = new Map(
            (recordObj) ? recordObj._fieldsInfo : []
        );
        let rt = this._selectedRecordsTemplate;
        let updatedFieldsInfo = [];
        rt._inputFieldNames.forEach(fieldName => {
            let value = (oldFieldsInfo.has(fieldName)) ?
                oldFieldsInfo.get(fieldName) : "";
            updatedFieldsInfo.push([fieldName, value]);
        });
        record._fieldsInfo = updatedFieldsInfo;
        this._unsavedRecord = record;

        let storedTaskOutcomes =
            this.loadLocalJSON("unsavedOutcomes", this._taskOutcomesSelected)
            || Array(rt.tasks.length).fill(0);
        let updatedTaskOutcomes = Array(rt.tasks.length).fill(0);
        let copyEnd = (storedTaskOutcomes.length >= rt.tasks.length) ?
            rt.tasks.length :
            storedTaskOutcomes.length;
        for (let index = 0; index < copyEnd; index++) {
            updatedTaskOutcomes[index] =
                (storedTaskOutcomes[index] <=
                    rt.tasks[index].taskOutcomes.length) ?
                    storedTaskOutcomes[index] : 0;

        }
        storedTaskOutcomes = updatedTaskOutcomes; 
        this._taskOutcomesSelected = storedTaskOutcomes;
    }
    get recordsGroupList () {return this._recordsGroupList};
    generateDefaultTemplateText() {
        let defaultTemplate = "";
        defaultTemplate +=
            (this._recordsTemplates.get("Default")) ?
                "Default " + new Date().toISOString() + "\n":
                "Default\n";
        defaultTemplate +=
            "Fields:ID\n" +
            "Tasks:\n" +
            "Completed?::Yes/No";
        return defaultTemplate;
    }

    loadRecordsGroupList(){
        let rgl = this.loadLocalJSON('recordsGroupList') || [];
        return rgl;
    }
    storeRecordsGroupList(){
        this.localSave('recordsGroupList', this.recordsGroupList);
    }

    storeSelectedRecordsGroup(){
        this.localSave("selectedRecordsGroup",this._selectedRecordsGroup.id );
        this.localSave(this._selectedRecordsGroup.id , this._selectedRecordsGroup);
    }

    loadSelectedRecordsGroup(){
        let recordsGroupID = localStorage.getItem("selectedRecordsGroup");
        recordsGroupID = JSON.parse(recordsGroupID);
        let rg = null;
        if (recordsGroupID != null) {
            let obj = this.loadLocalJSON(recordsGroupID);
            if (obj !== null){
                let records = obj._records.map(
                    r => {
                        let taskRecord = new TaskRecord(
                            r._fieldsInfo,
                            r._tasksAndOutcomes,
                            r._comments,
                            r._creationDate);
                        taskRecord.tracked = r._tracked;
                        return taskRecord ;
                    });
                rg = new RecordsGroup(obj._name, obj._type, obj._date, records);
            }  else {
                rg = this.setupNewRecordsGroup('Default Group','Default');
            } 

        } else {
            rg = this.setupNewRecordsGroup('Default Group', 'Default');

        }
        if (this._recordsTemplates.has(rg.type) &&
            (rg.type != this._selectedRecordsTemplate.name)) {
                this.selectedRecordsTemplate = rg.type
        } else if ( !this._recordsTemplates.has(rg.type)) {
            rg.type = this._selectedRecordsTemplate.name;
            this.storeSelectedRecordsGroup();
        }
        return rg;
    }
    deleteCurrentRecordsGroup(){
        let currentID = this._selectedRecordsGroup.id;
        this._recordsGroupList = this.recordsGroupList.filter( id => id != currentID );
        this.storeRecordsGroupList();
        this.localSave("selectedRecordsGroup", "");
        localStorage.removeItem(currentID);
        if (this.recordsGroupList.length > 0) {
            this.localSave("selectedRecordsGroup", this.recordsGroupList[0]);
        }
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
    }
    setupNewRecordsGroup(name, type){
        let rg = new RecordsGroup(name,type);
        this._recordsGroupList.push(rg.id);
        this.storeRecordsGroupList();
        this._selectedRecordsGroup = rg;
        this.storeSelectedRecordsGroup();
        return rg;
    }
    changeSelectedRecordsGroup(id) {
        this.localSave("selectedRecordsGroup", id);
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
    }
    renameCurrentRecordsGroup(newName){
        let repeated = this.recordsGroupList.includes(newName);
        if (!repeated) {
            let oldID = this._selectedRecordsGroup.id;
            this._selectedRecordsGroup.name = newName;
            this._recordsGroupList = this.recordsGroupList.filter( id => id != oldID);
            this._recordsGroupList.push(newName);
            this._recordsGroupList = this.recordsGroupList.sort();
            this.storeRecordsGroupList();
            this.storeSelectedRecordsGroup();
            localStorage.removeItem(oldID);
        }
    }

    get selectedRecordsTemplate(){
        return this._selectedRecordsTemplate;
    }
    set selectedRecordsTemplate(name){
        localStorage.setItem('selectedRecordsTemplate', name);
        this._selectedRecordsTemplate = this.loadSelectedTemplate();
    }

    updateSelectedTaskOutcome(taskIndex,outcomeIndex){
        this._taskOutcomesSelected[taskIndex] = outcomeIndex;
    }
    
    loadSelectedTemplate(){
        let name = localStorage.getItem("selectedRecordsTemplate");
        let rt  = name ? this._recordsTemplates.get(name): null;
        if (rt === null) {
            name = "Default";
            rt = this._recordsTemplates.get("Default");
            localStorage.setItem('selectedRecordsTemplate', name);
        }
        return rt;
    }


    changeCurrentRecordsTemplate(text) {
        let t = new RecordsTemplate(text);
        let currentName = this.selectedRecordsTemplate.name;
        if (t.name != currentName) {
            this._recordsTemplates.delete(currentName)
        }
        this._recordsTemplates.set(t.name, t);
        this.selectedRecordsTemplate = t.name;
        this.storeTemplates();
        this.loadTemplates();
        tth._selectedRecordsGroup._type = t.name;
        tth.storeSelectedRecordsGroup();
    }


    storeTemplates(){
        localStorage.setItem('selectedRecordsTemplate', this.selectedRecordsTemplate.name);
        let arr = Array.from(this._recordsTemplates).map( rt => rt[1].templateText);
        localStorage.setItem("storedTemplates", JSON.stringify(arr));
    }

    addTemplate(text){
        const rt = new RecordsTemplate(text);
        this._recordsTemplates.set(rt.name,rt);
        this.selectedRecordsTemplate = rt.name;
        this.storeTemplates();
    }
    deleteSelectedRecordsTemplate(){
        let stName = this.selectedRecordsTemplate.name
        this._recordsTemplates.delete(stName)
        this.storeTemplates();
        let newSelection = this._recordsTemplates.keys().next()
        if (newSelection.value) {
            this.selectedRecordsTemplate = newSelection.value;
        } else {
            this.loadTemplates();
        }
    }

    loadTemplates(){
        let jsonTemplates = this.loadLocalJSON('storedTemplates');
        this._recordsTemplates = new Map();
        if (jsonTemplates != null) {
            jsonTemplates.forEach(
                templateText => {
                    let rt = new RecordsTemplate(templateText);
                    this._recordsTemplates.set(rt.name, rt);
                }
            );
        }
        if (this._recordsTemplates.size == 0 ){
            console.log("No stored templates, generating default")
            let defaultTemplate =  this.generateDefaultTemplateText();
            let rt = new RecordsTemplate(defaultTemplate)
            this._recordsTemplates.set(rt.name, rt);
            this._selectedRecordsTemplate = rt;
            this.storeTemplates();
        }
        return this._recordsTemplates;
    }

    localSave(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }

    loadLocalJSON (key) {
        let jsonString =  localStorage.getItem(key);
        return  ( jsonString != null) ?  JSON.parse(jsonString) : null;
    }
}


// Task 
// Defined by a single line string in the format:
// TaskDescription::Outcome1/Outcome2...
// where :: delimitts description and outcomes
// and / delimits each possible outcome
class Task {
    constructor(defString){
        this._defString = defString;
        let parts = this._defString.split("::");
        if (parts.length != 2) {
            throw new SyntaxError(
                `Invalid Task definition: ${this._defString}`);
        };
        this._taskDescription = parts[0];
        this._taskOutcomes = parts[1].split("/");
        if (this._taskOutcomes.length == 0) {
            throw new SyntaxError(
                `Invalid Task definition: ${this._defString}\n
                missing outcomes`);
        }
    }
    get taskDescription() {
        return this._taskDescription;
    }
    get taskOutcomes (){
        return this._taskOutcomes;
    }
}

// TaskRecord
// Stores the outcomes and entered fields in a single string.
class TaskRecord{
    constructor(fieldsInfo, tasksAndOutcomes , comments, creationDate) {
        this._fieldsInfo = fieldsInfo;
        this._tasksAndOutcomes = tasksAndOutcomes;
        this._comments = comments;
        this.tracked = false;
        this._creationDate = creationDate;
        if (this._creationDate == "") {
            var now = new Date()
            this._creationDate = now.toISOString().replace("T", " ").substring(0, 19);
        }
        this._summary = this.getInfo();
    }
    get tracked(){ return this._tracked;}
    set tracked(val){this._tracked = val}
    async recalculateID () {
        this.id = await hash(this._summary);
    }
    getInfo() {
        let info = this._fieldsInfo.map(infoPair => infoPair.join(": ")).join("\n");
        info += "\n";
        info += this._tasksAndOutcomes.map(infoPair => infoPair.join(" ")).join("\n");
        info += "\n";
        info += "Comments:\n" + this._comments || "NA";
        info += "\n";
        info += "Date: " + this._creationDate;
        return info;
    }
    

}

// RecordsGroup
// Holds a records group with date and type
class RecordsGroup {
    constructor(name,type, ...args) {
        this._type = type;
        this._name = name;
        this._date = 
            (args.length == 2) ?
                args[0] :
                new Date().toISOString().replace("T", " ").substring(0, 19);
        this._id = this.generateID();
        this._records = (args.length == 2) ? args[1]: [];
    }

    get id (){return this._id;}
    get date (){return this._date;}
    get type (){return this._type;}
    set type(t){this._type = t;}
    get records (){return this._records;}
    get name (){return this._name;}
    set name (name){
        this._name = name;
        this._id = this.generateID();
    }
    
    generateID () { 
        return this._name; 
    }
    addRecord(r) {
        this._records.push(r);
    }
    deleteRecord(id) {
        this._records =
            this._records.filter(r => r.id !== id);
        console.log("deleted: " +id);
        console.log(this._records);
    }
    setTrackedStatus(id, status) {
        let r = this._records.find(r => r.id === id);
        r.tracked = status;
    }
    getTrackedStatus(id) {
        let r = this._records.find(r => r.id === id);
        return r.tracked ;
    }
    toPrettyString(){
        let dashes = "\n" + "-".repeat(80) + "\n";
        let stars = "*".repeat(80) + "\n";
        let info = stars;
        info += `Records Group : ${this.name}\nCreated on: ${this.date}\n`
        info += stars;
        info += this.records.map(r => r._summary).join(dashes);
        return info;
    }
    toBlob(){
        return new Blob([this.toPrettyString()],{type: "text/plain"})
    }
}

// RecordsTemplate
// Stores input values and tasks related to 
// a Record type
class RecordsTemplate {
    constructor(templateText){
        this._templateText = templateText;
        this.updateTemplate();
    }
    get name() { return this._name; }
    set name(n) { this._name = n; }
    get inputFieldNames() { return this._inputFieldNames; }
    get inputFieldIDs() { return this._inputFieldIDs; }
    get tasks() { return this._tasks; }
    get templateText() { return this._templateText; }
    set templateText(text) { 
        this._templateText = text; 
        this.updateTemplate(); 
    }

    updateTemplate() {
        let rawLines = this._templateText.split('\n');
        this._lines = rawLines.filter(l => l != "");
        this._name = this.generateNameFromTemplate();
        this._inputFieldNames = this.generateInputFields();
        this._inputFieldIDs = [];
        this._tasks = this.generateTasks();

    }

    async updateInputIDs(){
        this._inputFieldIDs = [];
        let ids = []
        for (let index = 0, length = this._inputFieldNames.length; index < length; index++) {
            ids.push(await hash(this._inputFieldNames[index]))
        }
        this._inputFieldIDs = ids;
        return ids;
    }

    generateNameFromTemplate(){
        return this._lines[0];
    }
    generateInputFields(){
        let line = this._lines[1];
        return line.replace(/Fields:\s*/,'').split(',');
    }
    generateTasks(){
        let tasks = [];
        let lines = this._templateText.split('\n');
        if (lines[2].match(/Tasks:\n/g) != 0 ){
            for (let index = 3, count = lines.length; index < count; index++) {
                const element = lines[index];
                tasks.push(new Task(element));
            }
        }
        return tasks;
    }

}


// HTMLView
// displays and retrieves info to and from the DOM 
class HTMLViews {
    constructor(tasksTrackingHelper){
        this._tasksTrackingHelper = tasksTrackingHelper
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
            ["click", "#btn-completed", this.trackCurrent],
            ["click", "#btn-copy-current", this.copyInfo],
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

    handleLogActions(event){
        let elementID = event.target.id ;
        let arr       = elementID.split("-");
        let fnList    = new Map();

        fnList.set("dr",this.deleteRecordAndView);
        fnList.set("chk",this.markRecordTrackedStatus);
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
                    <button class='copy' onclick="copyToClipboard('${id}')">&#x2398;</button>
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
    copyInfo() {
        navigator.clipboard.writeText(this.getCurrentInfo()).then(function () {
            /* clipboard successfully set */
            console.log("Text copied")
        }, function () {
            /* clipboard write failed */
            console.log("Text not copied")
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

function copyToClipboard(divID) {
    var r = document.createRange();
    r.selectNode(document.getElementById(divID));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
}
function copyInputToClipboard(inputID) {
    document.getSelection().removeAllRanges();
    document.getElementById(inputID).select();
    document.execCommand("copy");
    document.getSelection().removeAllRanges();
}
async function hash(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(buffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
}

let tth = new TasksTrackingHelper();

