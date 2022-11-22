// deno-lint-ignore-file no-explicit-any no-namespace

import { infoFile } from "./info.ts";
import { scuffedWallsInUse } from "./main.ts";


export const pointDefinitions = ["NULL"];

export let environment: any[];
export let notes: any[];
export let walls: any[];
export let events: any[];
export let materials: any = {};
export let geometry: any[];
export let definitions: any[];
export let fakeNotes: any[];

export let activeInput: string;
export let activeOutput: string;
export let V3: boolean;

export namespace Map {
    /**
     * @param input The input file for the difficulty.
     * @param output The output file for the difficulty.
     * @param NJS The NJS of the new difficulty. 
     * @param offset The offset of the new difficulty.
     */
    function isV3(diffName: string) {
        const diff = JSON.parse(Deno.readTextFileSync(diffName));

        if (typeof diff._version !== 'undefined') V3 = false;
        if (typeof diff.version !== 'undefined') V3 = true;
    }
    export function initialize(input: string, output: string, NJS: number, offset: number) {
        isV3(`./${input}`);
        const diff = JSON.parse(Deno.readTextFileSync(`./${input}`));
        infoFile._difficultyBeatmapSets.forEach((x: any) => {
            x._difficultyBeatmaps.forEach((y: any) => {
                delete(y._settings)
                delete(y._requirements)
                delete(y._suggestions)
            })
        });
        Deno.writeTextFileSync('Info.dat', JSON.stringify(infoFile, null, 4))
        activeInput = input;
        activeOutput = output;
    
    
        if (!V3) {
            notes = diff._notes;
            walls = diff._obstacles;
            
            if (!diff._customData) {
                diff._customData = {};
            }
            diff._notes.forEach((x: { _customData: { _noteJumpStartBeatOffset: number; _noteJumpMovementSpeed: number; }; }) => {
                if (!x._customData) {
                    x._customData = {
                        _noteJumpStartBeatOffset: offset,
                        _noteJumpMovementSpeed: NJS
                    }
                }
            });
            diff._obstacles.forEach((x: { _customData: { _noteJumpStartBeatOffset: number; _noteJumpMovementSpeed: number; }; }) => {
                if (!x._customData) {
                    x._customData = {
                        _noteJumpStartBeatOffset: offset,
                        _noteJumpMovementSpeed: NJS
                    }
                }
            });
        
            const customData = diff._customData;

            customData._customEvents = [];
            customData._pointDefinitions = [];
            customData._environment = [];
            customData._materials = {};
        
            //(output, JSON.stringify(diff, null, 4));
        
            events = diff._customData._customEvents;
            environment = customData._environment;
            definitions = diff._customData._pointDefinitions;
            materials = customData._materials;
        }
        else if (V3) {
            notes = diff.colorNotes;
            walls = diff.obstacles;
            
            if (!diff.customData) {
                diff.customData = {};
            }
            if (!diff.customData.fakeColorNotes) {
                diff.customData.fakeColorNotes = [];
            }
            diff.colorNotes.forEach((x: { customData: { noteJumpStartBeatOffset: number; noteJumpMovementSpeed: number; }; }) => {
                if (!x.customData) {
                    x.customData = {
                        noteJumpStartBeatOffset: offset,
                        noteJumpMovementSpeed: NJS
                    }
                }
            });
            diff.obstacles.forEach((x: { customData: { noteJumpStartBeatOffset: number; noteJumpMovementSpeed: number; }; }) => {
                if (!x.customData) {
                    x.customData = {
                        noteJumpStartBeatOffset: offset,
                        noteJumpMovementSpeed: NJS
                    }
                }
            });
        
            const customData = diff.customData;

            customData.customEvents = [];
            customData.pointDefinitions = {};
            customData.environment = [];
            customData.materials = {};
        
            //(output, JSON.stringify(diff, null, 4));
        
            events = diff.customData.customEvents;
            environment = customData.environment;
            definitions = diff.customData.pointDefinitions;
            materials = customData.materials;
            fakeNotes = customData.fakeColorNotes;
        }
    
        return diff;
    }
    
    /**
     * @param difficulty The difficulty that the map should be written to.
     */
    export function finalize(difficulty: any) {
        const precision = 4; // decimals to round to  --- use this for better wall precision or to try and decrease JSON file size
    
        const jsonP = Math.pow(10, precision);
        const sortP = Math.pow(10, 2);
        function deeperDaddy(obj: any) {
            if (obj) 
                for (const key in obj) {
                    if (obj[key] == null) {
                        delete obj[key];
                    } else if (typeof obj[key] === "object" || Array.isArray(obj[key])) {
                        deeperDaddy(obj[key]);
                    } else if (typeof obj[key] == "number") {
                        obj[key] = (Math.round((obj[key] + Number.EPSILON) * jsonP) / jsonP);
                    }
                }
            
        }
        deeperDaddy(difficulty)
    

        let vanilla:any;
        let modded:any;
        let AT = 0;
        let PA = 0;
        let TP = 0;
        let PT = 0;
        let fakes = 0;
        let NotesCount = [0, 0];
        let WallsCount = [0, 0];

        if (!V3) {
            difficulty._notes.sort((a: { _time: number; _lineIndex: number; _lineLayer: number; }, b: { _time: number; _lineIndex: number; _lineLayer: number; }) => (Math.round((a._time + Number.EPSILON) * sortP) / sortP) - (Math.round((b._time + Number.EPSILON) * sortP) / sortP) || (Math.round((a._lineIndex + Number.EPSILON) * sortP) / sortP) - (Math.round((b._lineIndex + Number.EPSILON) * sortP) / sortP) || (Math.round((a._lineLayer + Number.EPSILON) * sortP) / sortP) - (Math.round((b._lineLayer + Number.EPSILON) * sortP) / sortP));
            difficulty._obstacles.sort((a: any, b: any) => a._time - b._time);
            difficulty._events.sort((a: any, b: any) => a._time - b._time);

            if (difficulty._customData._materials.length < 1) {
                delete(difficulty._customData._materials)
            }

            Deno.writeTextFileSync(activeOutput, JSON.stringify(difficulty, null, 4))
            if (scuffedWallsInUse) {
                const ts = JSON.parse(Deno.readTextFileSync(activeOutput));
                const tsNotes = ts._notes;
                const tsWalls = ts._obstacles;
                const tsEvents = ts._events;
                const tsCustomEvents = ts._customData._customEvents;

                const sw = JSON.parse(Deno.readTextFileSync('./temp/tempOut.dat'))
                const swNotes = sw._notes;
                const swWalls = sw._obstacles;
                const swEvents = sw._events;
                const swCustomEvents = sw._customData._customEvents;

                tsNotes.push(...swNotes)
                tsWalls.push(...swWalls)
                tsEvents.push(...swEvents)
                tsCustomEvents.push(...swCustomEvents)

                Deno.writeTextFileSync(activeOutput, JSON.stringify(ts, null, 4))
            }
        
            vanilla = JSON.parse(Deno.readTextFileSync(activeInput));
            modded = JSON.parse(Deno.readTextFileSync(activeOutput))
        
            modded._customData._customEvents.forEach((e: any) => {
                switch (e._type) {
                    case "AnimateTrack":
                        AT++;
                        break;
                    case "AssignPathAnimation":
                        PA++;
                        break;
                    case "AssignTrackParent":
                        TP++;
                        break;
                    case "AssignPlayerToTrack":
                        PT++;
                        break;
                }
            });
        
            modded._notes.forEach((n: any) => {
                if (n._customData._fake) fakes++;
            });
            WallsCount = [ vanilla._obstacles.length, modded._obstacles.length ];
            NotesCount = [ vanilla._notes.length, modded._notes.length ];
        }
        if (V3) {
            difficulty.colorNotes.sort((a: { b: number; x: number; y: number; }, b: { b: number; x: number; y: number; }) => (Math.round((a.b + Number.EPSILON) * sortP) / sortP) - (Math.round((b.b + Number.EPSILON) * sortP) / sortP) || (Math.round((a.x + Number.EPSILON) * sortP) / sortP) - (Math.round((b.x + Number.EPSILON) * sortP) / sortP) || (Math.round((a.y + Number.EPSILON) * sortP) / sortP) - (Math.round((b.y + Number.EPSILON) * sortP) / sortP));
            difficulty.obstacles.sort((a: any, b: any) => a.b - b.b);
            difficulty.basicBeatmapEvents.sort((a: any, b: any) => a.b - b.b);
            if (difficulty.customData.materials.length < 1) {
                delete(difficulty.customData.materials)
            }
        
            Deno.writeTextFileSync(activeOutput, JSON.stringify(difficulty, null, 4))
        
            vanilla = JSON.parse(Deno.readTextFileSync(activeInput));
            modded = JSON.parse(Deno.readTextFileSync(activeOutput))
        
            modded.customData.customEvents.forEach((e: any) => {
                switch (e.type) {
                    case "AnimateTrack":
                        AT++;
                        break;
                    case "AssignPathAnimation":
                        PA++;
                        break;
                    case "AssignTrackParent":
                        TP++;
                        break;
                    case "AssignPlayerToTrack":
                        PT++;
                        break;
                }
            });
            WallsCount = [ vanilla.obstacles.length, modded.obstacles.length ];
            NotesCount = [ vanilla.colorNotes.length, modded.colorNotes.length ];
            fakes = modded.customData.fakeColorNotes.length;
        }

        
        

        console.log(" \x1b[5m\x1b[35m\x1b[1m __  __                 __      \x1b[37m__           __        ")
        console.log(" \x1b[35m/\\ \\/\\ \\               /\\ \\  _ \x1b[37m/\\ \\       __/\\ \\       ")
        console.log(" \x1b[35m\\ \\ \\_\\ \\     __    ___\\ \\ \\/ \\\x1b[37m\\ \\ \\     /\\_\\ \\ \\____  ")
        console.log(" \x1b[35m \\ \\  _  \\  / __ \\ / ___\\ \\   < \x1b[37m\\ \\ \\    \\/\\ \\ \\  __ \\ ")
        console.log(" \x1b[35m  \\ \\ \\ \\ \\/\\  __//\\ \\__/\\ \\ \\\\ \\\x1b[37m\\ \\ \\____\\ \\ \\ \\ \\_\\ \\")
        console.log(" \x1b[35m   \\ \\_\\ \\_\\ \\____\\ \\____\\\\ \\_\\ \\_\x1b[37m\\ \\____/ \\ \\_\\ \\____/")
        console.log(" \x1b[35m    \\/_/\\/_/\\/____/\\/____/ \\/_/\\/_/\x1b[37m\\/___/   \\/_/\\/___/ ")
        console.log(" \x1b[0m ")
        console.log(" ======================================================= \n")
        console.log(" \x1b[36m\x1b[1m\x1b[4m" + "=== VANILLA MAP INFO ===" + "\x1b[0m" + "\n\n Notes: \x1b[32m\x1b[1m" + NotesCount[0] + "\x1b[0m\n Walls: \x1b[32m\x1b[1m" + WallsCount[0] + "\x1b[0m\n\n")
        console.log(" \x1b[36m\x1b[1m\x1b[4m" + "=== MODDED MAP INFO ===" + "\x1b[0m" + "\n\n Notes: \x1b[32m\x1b[1m" + NotesCount[1] + "\x1b[0m\n" + " Fake Notes: \x1b[32m\x1b[1m" + fakes + "\x1b[0m\n\n Walls: \x1b[32m\x1b[1m" + WallsCount[1] + "\x1b[0m\n\n")
        console.log(" \x1b[36m\x1b[1m\x1b[4m" + "=== CUSTOM EVENTS INFO ===" + "\x1b[0m" + "\n\n AnimateTracks: \x1b[32m\x1b[1m" + AT + "\x1b[0m\n PathAnimations: \x1b[32m\x1b[1m" + PA + "\x1b[0m\n TrackParents: \x1b[32m\x1b[1m" + TP + "\x1b[0m\n PlayerTracks: \x1b[32m\x1b[1m" + PT + "\x1b[0m\n\n");
        console.log(" \x1b[36m\x1b[1m\x1b[4m" + "=== ENVIRONMENT INFO ===" + "\x1b[0m" + "\n\n Environment Objects: \x1b[32m\x1b[1m" + environment.length + "\x1b[0m\n\n")
    }
}