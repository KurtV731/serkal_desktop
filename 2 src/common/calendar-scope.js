'use strict';
// null means an explicit full-target reconciliation; [] means no Calendar work.
function changes(before,after){
    if(!before||before.target!==after.target)return null;
    return [...new Set([...Object.keys(before.groups),...Object.keys(after.groups)])]
        .filter(key=>before.groups[key]!==after.groups[key]).sort();
}
function union(a,b){return a===null||b===null?null:[...new Set([...a,...b])].sort();}
function read(value){return Array.isArray(value)&&value.every(k=>/^\d+:S\d{2,3}$/.test(k))?[...new Set(value)].sort():null;}
module.exports={changes,union,read};
