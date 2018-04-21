///<reference path="../data/Data5.ts"/>
///<reference path="../data/PersonaData.ts"/>
///<reference path="../data/SkillData.ts"/>

/**
 * Created by Chin on 08-Apr-17.
 */

function addStatProperties(persona: PersonaData) : void {
    persona.strength = persona.stats[0];
    persona.magic = persona.stats[1];
    persona.endurance = persona.stats[2];
    persona.agility = persona.stats[3];
    persona.luck = persona.stats[4];
}

function addElementProperties(persona: PersonaData) : void {
    let properties = ['physical', 'gun', 'fire', 'ice', 'electric', 'wind', 'psychic', 'nuclear', 'bless', 'curse'];
    const elemsValue = {"wk":0, "-":1, "rs":2, "nu":3, "rp":4, "ab":5};
    for (let i = 0; i < properties.length; i++) {
        persona[properties[i]] = persona.elems[i];
        persona[properties[i] + 'Value'] = elemsValue[persona.elems[i]];
    }
}

function isDlcPersonaOwned(dlcPersona: string): boolean {
    if (!localStorage["dlcPersona"]) return true;

    return JSON.parse(localStorage["dlcPersona"])[dlcPersona] === true;
}

/**
 * List of persona with DLC persona potentially removed based on user config
 */
const customPersonaList: PersonaData[] = (() =>{
    let arr = [];
    for (let key in personaMap) {
        if (personaMap.hasOwnProperty(key)) {
            let persona = personaMap[key];
            if (persona.dlc && !isDlcPersonaOwned(key)) {
                continue;
            }
            persona.name = key;
            addStatProperties(persona);
            addElementProperties(persona);
            arr.push(persona);
        }
    }
    return arr;
})();

const fullPersonaList: PersonaData[] = (() =>{
    let arr = [];
    for (let key in personaMap) {
        if (personaMap.hasOwnProperty(key)) {
            let persona = personaMap[key];
            persona.name = key;
            addStatProperties(persona);
            addElementProperties(persona);
            arr.push(persona);
        }
    }
    return arr;
})();

const skillList: SkillData[] = (() =>{
    let arr = [];
    for (let key in skillMap) {
        if (skillMap.hasOwnProperty(key)) {
            let skill = skillMap[key];
            skill.name = key;
            skill.elemDisplay = capitalizeFirstLetter(skill.element);
            skill.costDisplay = getSkillCost(skill);
            skill.personaDisplay = getSkillPersonaList(skill);
            if (skill.talk) {
                skill.talkDisplay = createPersonaLink(skill.talk);
            }
            if (skill.fuse) {
                skill.fuseDisplay = createPersonaLink(skill.fuse);
            }
            arr.push(skill);
        }
    }
    return arr;
})();

/**
 * Persona by arcana based on customPersonaList
 */
const customPersonaeByArcana : {[arcana: string]: PersonaData[]} = (() =>{
    let personaeByArcana_ = {};
    for (let i = 0; i < customPersonaList.length; i++) {
        let persona = customPersonaList[i];
        if (!personaeByArcana_[persona.arcana]) {
            personaeByArcana_[persona.arcana] = [];
        }
        personaeByArcana_[persona.arcana].push(persona);
    }

    for (let key in personaeByArcana_) {
        personaeByArcana_[key].sort((a,b) => a.level - b.level);
    }

    return personaeByArcana_;
})();

const arcanaMap = (() => {
    let map = {};
    for (let i = 0; i < arcana2Combos.length; i++) {
        let combo = arcana2Combos[i];
        if (!map[combo.source[0]]) map[combo.source[0]] = {};
        map[combo.source[0]][combo.source[1]] = combo.result;

        if (!map[combo.source[1]]) map[combo.source[1]] = {};
        map[combo.source[1]][combo.source[0]] = combo.result;
    }
    return map;
})();

const getResultArcana = (arcana1: string, arcana2: string) => {
    return arcanaMap[arcana1][arcana2];
};

const special2Combos = (() => {
    let combos = [];
    for (let i = 0; i < specialCombos.length; i++) {
        if (specialCombos[i].sources.length == 2) {
            combos.push(specialCombos[i]);
        }
    }
    return combos;
})();

function getElems(personaName: string) {
    let elemTable = {
        "wk": {
            "short": "wk",
            "long": "Weak",
            "icon": "Wk.svg"
        },
        "rs": {
            "short": "rs",
            "long": "Resist",
            "icon": "Str.svg"
        },
        "ab": {
            "short": "ab",
            "long": "Absorb",
            "icon": "Dr.svg"
        },
        "rp": {
            "short": "rp",
            "long": "Repel",
            "icon": "Rpl.svg"
        },
        "nu": {
            "short": "nu",
            "long": "Null",
            "icon": "Null.svg"
        }
    }
    let elems = personaMap[personaName].elems;
    for (let i = 0; i < elems.length; i++) {
        elems[i] = elemTable[elems[i]];
    }
    return elems;
}

function getSkills(personaName: string) {
    let skills = personaMap[personaName].skills;
    let sorted = [];
    for (let name in skills) {
        if (skills.hasOwnProperty(name)) {
            sorted.push([name, skills[name]]);
        }
    }

    sorted.sort(function(a, b) {
        return a[1] - b[1];
    });

    let resSkills = [];
    for (let i = 0; i < sorted.length; i++) {
        let skillData = skillMap[sorted[i][0]];
        resSkills.push({
            name: sorted[i][0],
            level: sorted[i][1],
            description: skillData.effect,
            elem: capitalizeFirstLetter(skillData.element),
            cost: getSkillCost(skillData)
        })
    }

    return resSkills;
}

function getSkillPersonaList(skill: SkillData) {
    let arr = [];
    for (let key in skill.personas) {
        if (skill.personas.hasOwnProperty(key)) {
            let level = skill.personas[key];
            let keyHref = createPersonaLink(key);
            arr.push(keyHref + (level !== 0? " (" + level + ")" : ""));
        }
    }
    let str = arr.join(", ");
    return str;
}

function createPersonaLink(personaName: string): string {
    return `<a href='#/persona/${personaName}'>${personaName}</a>`;
}

function capitalizeFirstLetter(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function getSkillCost(skill: SkillData) {
    if (skill.element != 'passive') {
        if (skill.cost < 100) {
            return String(skill.cost) + '% HP'
        }
        else {
            return String(skill.cost / 100) + ' SP';
        }
    }
    else {
        return "-"
    }
}