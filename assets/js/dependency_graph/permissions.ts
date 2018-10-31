const permissions_handler = {
    "user_can_edit": undefined,
};

export function set_user_can_edit(value: boolean) {
    permissions_handler.user_can_edit = value;
}

export function can_user_edit() {
    return permissions_handler.user_can_edit;
}