/*
 *  Copyright (c) 2020, J. Garcia <0x4a.dev at gmail.com> 
 *  All rights reserved.
 *  
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *      * Redistributions of source code must retain the above copyright
 *        notice, this list of conditions and the following disclaimer.
 *      * Redistributions in binary form must reproduce the above copyright
 *        notice, this list of conditions and the following disclaimer in the
 *        documentation and/or other materials provided with the distribution.
 *      * Neither the name of the <organization> nor the
 *        names of its contributors may be used to endorse or promote products
 *        derived from this software without specific prior written permission.
 *  
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 *  DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 *  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 *  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 *  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 *  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 *  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 *  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Main Object Class
// Defines the main general variables and functions to start the app
class TasksTrackingHelper {

    constructor(){
        this._recordsTemplates = this.loadTemplates();
        this._selectedRecordsTemplate = this.loadSelectedTemplate();
        this._recordsGroupList = this.loadRecordsGroupList();
        this._selectedRecordsGroup = this.loadSelectedRecordsGroup();
        this.storeSelectedRecordsGroup();
        this._htmlViews = new HTMLViews(this);
    }
    get recordsGroupList () {return this._recordsGroupList};
    get selectedRecordsTemplate(){
        return this._selectedRecordsTemplate;
    }
    set selectedRecordsTemplate(name){
        localStorage.setItem('selectedRecordsTemplate', name);
        this._selectedRecordsTemplate = loadSelectedTemplate();
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
                    r => Object.assign(new TaskRecord("", ""), r)
                );
                rg = new RecordsGroup(obj._type, obj._date, records);
            }  else {
                rg = this.setupNewRecordsGroup('Default');
            } 

        } else {
            rg = this.setupNewRecordsGroup('Default');

        }
        return rg;
    }
    setupNewRecordsGroup(type){
        let rg = new RecordsGroup(type);
        this.recordsGroupList.push(rg.id);
        this.storeRecordsGroupList();
        return rg;
    }

    loadSelectedTemplate(){
        let name = localStorage.getItem("selectedRecordsTemplate");
        if (!name) name = "Default"
        let rt  = this._recordsTemplates.get(name);
        if (rt === null) {
            name = "Default";
            rt = this._recordsTemplates.get("Default");
        }
        console.log("Selected template is:")
        console.log(rt);
        localStorage.setItem('selectedRecordsTemplate', name);
        return rt;
    }


    storeTemplates(){
        this.localSave("storedTemplates",this._recordsTemplates);
        let arr = Array.from(this._recordsTemplates).map( rt => rt[1].templateText);
        console.log(arr)
        localStorage.setItem("storedTemplates", JSON.stringify(arr));
    }

    localSave(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    }

    loadTemplates(){
        let jsonTemplates = this.loadLocalJSON('storedTemplates');
        this._recordsTemplates = new Map();
        if (jsonTemplates != null) {
            jsonTemplates.forEach(
                templateText => {
                    console.log('Loading Template:');
                    console.log(templateText);
                    let rt = new RecordsTemplate(templateText);
                    this._recordsTemplates.set(rt.name, rt);
                }
            );
        }
        if (this._recordsTemplates.size == 0 ){
            console.log("No stored templates, generatign default")
            let defaultTemplate =  
                "Default\n" +
                "Fields:ID\n" +
                "Tasks:\n" +
                "Completed?::Yes/No";
            let rt = new RecordsTemplate(defaultTemplate)
            this._recordsTemplates.set(rt.name, rt);
            this.storeTemplates();
        }
        return this._recordsTemplates;
    }

    loadLocalJSON (key) {
        let jsonString =  localStorage.getItem(key);
        return  ( jsonString != null) ?  JSON.parse(jsonString) : null;
    }
    addTemplate(text){
        const rt = new RecordsTemplate(text);
        this._recordsTemplates.set(rt.name,rt);
        this.storeTemplates();
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
    constructor(summary, creationDate) {
        this._summary = summary;
        this.tracked = false;
        if (creationDate == "") {
            var now = new Date()
            this.creationDate = now.toISOString().replace("T", " ").substring(0, 19);
        }
        this.recalculateID();
    }
    async recalculateID () {
        this.id = await hash(this._summary);
    }
    getInfo() {
        return  this._summary + "\nDate: " + this.creationDate + "\n";

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
        this._lines = this._templateText.split('\n');
        this._name = this.generateNameFromTemplate();
        this._inputFieldNames = this.generateInputFields();
        this.updateInputIDs();
        this._inputFieldIDs = [];
        this._tasks = this.generateTasks();

    }

    async updateInputIDs(){
        this._inputFieldIDs = this._inputFieldNames.map(n => hash(n));
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
                console.log("new task:" + element)
                tasks.push(new Task(element));
            }
        }
        return tasks;
    }

}

// RecordsGroup
// Holds a records group with date and type
class RecordsGroup {
    constructor(type, ...args) {
        this._type = type;
        this._date = 
        (args.length == 2) ?
            args[0] :
            new Date().toISOString().replace("T", " ").substring(0, 19);
        this._id = this.generateID();;
        this._records = (args.length == 2) ? args[1]: [];
    }

    get id (){return this._id;}
    get date (){return this._date;}
    get type (){return this._type;}
    get records (){return this._records;}
    
    generateID () { 
        return this._type + ":" + this._date; 
    }
    addRecord(r) {
        this._records.push(r);
    }
    deleteRecord(id) {
        this._records.filter(r => r.id !== id);
    }
}

// HTMLView
// displays and retrieves info to and from the DOM 
class HTMLViews {
    constructor(tasksTrackingHelper){
        this._tasksTrackingHelper = tasksTrackingHelper
        this._logCount = 0;
        this.createInputFields();
        this.createTaskViews();
        this.showCurrentGroup();
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
        let btnCopyCurrent = document.getElementById("btn-copy-current");
        let btnCompleted = document.getElementById("btn-completed");
        btnCopyCurrent.addEventListener(
            "click", 
            (() => this.copyInfo()).bind(this),
            true
        );
        btnCompleted.addEventListener(
            "click", 
            (() => this.trackCurrent()).bind(this),
            true
        );

        let tasks = this._tasksTrackingHelper.selectedRecordsTemplate.tasks;
        document.getElementById('tasks-info').addEventListener('click',
            (event => {
                if (event.target.tagName == 'INPUT') {
                    if (event.target.id.match(/\d+-\d+/).length > 0) {

                        this.setOutcome(event.target.id);
                    }
                }

            }).bind(this)
        );

    }

    createInputFields() {
        this.tasksTrackingHelper.selectedRecordsTemplate.updateInputIDs().then( () => {
            let inputFieldNames = this.tasksTrackingHelper.selectedRecordsTemplate.inputFieldNames;
            let fieldsContainer = document.getElementById("in-fields");
            fieldsContainer.innerHTML = "";
            let ids = this.tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
            inputFieldNames.forEach((n, index) => {
                fieldsContainer.innerHTML +=
                    `<label for="${ids[index]}" class="label">${n}</label>
                    <input id="${ids[index]}" type="text">
                    <button tabindex="-1" class='copy' 
                    onclick="copyInputToClipboard('${ids[index]}')">&#x2398</button>`
            });
        }) ;
    }

    createTaskViews(){
        let tasks = this._tasksTrackingHelper.selectedRecordsTemplate.tasks;
        const infoDiv = document.getElementById("tasks-info");
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

    setOutcome(toid) {
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

    trackCurrent() {
        console.log("Tracking")
        let hasEmptyFields = false;
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
        let taskRecordsGroup = this._tasksTrackingHelper._selectedRecordsGroup;

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
            var tr = new TaskRecord(info, "");
            taskRecordsGroup.addRecord(tr);
            this._tasksTrackingHelper.storeSelectedRecordsGroup();
            tr.recalculateID().then(() => this.showInLog(tr));
            this.clearFields();
        }
    }
    showInLog(taskRecord) {
        this.logCount += 1;
        let logDiv = document.getElementById("log");
        let id = taskRecord.id;
        logDiv.innerHTML =
            `<div class='record-container'>
                    <button class='copy' onclick=copyToClipboard('${id}')>&#x2398</button>
                    <div class='record-header'> 
                        <h3 class='count'>${this.logCount}</h3> 
                        <label for='tbf-${id}' class='small-label'>Tracked</label> 
                        <input id='tbf-${id}' type=checkbox>
                        <button class='delete-btn'>&#x1F5D1;</button>
                    </div>
                    <div id='${id}' class=\"record\">${taskRecord.getInfo()}</div> 
        </div>` + logDiv.innerHTML;
    }
    showCurrentGroup() {
        let taskRecords = this._tasksTrackingHelper._selectedRecordsGroup.records;
        this.logCount = 0;
        taskRecords.forEach( tr => this.showInLog(tr));

    }

    clearFields() {
        let ids = this._tasksTrackingHelper.selectedRecordsTemplate.inputFieldIDs;
        ids.forEach(id => document.getElementById(id).value = "");
        this.setDefaults();
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

