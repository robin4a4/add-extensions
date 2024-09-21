import { getDate } from "./utils/getDate.js";
import { getUser } from "./utils/getUser.js";

export function useDate() {
    return getDate();
}

export function useUser() {
    return getUser()
}
