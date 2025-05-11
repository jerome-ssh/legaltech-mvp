"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var nextjs_1 = require("@clerk/nextjs");
var supabase_1 = require("../src/lib/supabase");
function createMissingProfiles() {
    return __awaiter(this, void 0, void 0, function () {
        var users, _i, users_1, user, _a, existingProfile, lookupError, _b, profile, createError, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, nextjs_1.clerkClient.users.getUserList()];
                case 1:
                    users = _d.sent();
                    console.log("Found ".concat(users.length, " users in Clerk"));
                    _i = 0, users_1 = users;
                    _d.label = 2;
                case 2:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    return [4 /*yield*/, supabase_1.supabase
                            .from('profiles')
                            .select('id')
                            .eq('clerk_id', user.id)
                            .single()];
                case 3:
                    _a = _d.sent(), existingProfile = _a.data, lookupError = _a.error;
                    if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                        console.error("Error looking up profile for user ".concat(user.id, ":"), lookupError);
                        return [3 /*break*/, 5];
                    }
                    if (existingProfile) {
                        console.log("Profile already exists for user ".concat(user.id));
                        return [3 /*break*/, 5];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('profiles')
                            .insert({
                            clerk_id: user.id,
                            email: (_c = user.emailAddresses[0]) === null || _c === void 0 ? void 0 : _c.emailAddress,
                            first_name: user.firstName,
                            last_name: user.lastName,
                            onboarding_completed: false,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                            .select()
                            .single()];
                case 4:
                    _b = _d.sent(), profile = _b.data, createError = _b.error;
                    if (createError) {
                        console.error("Error creating profile for user ".concat(user.id, ":"), createError);
                        return [3 /*break*/, 5];
                    }
                    console.log("Created profile for user ".concat(user.id, ":"), profile);
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log('Finished processing all users');
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _d.sent();
                    console.error('Error in createMissingProfiles:', error_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
createMissingProfiles();
