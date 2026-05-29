export type PopupState = {
    show: boolean;
    text: string;
    showCancel?: boolean;
    onConfirm?: () => void;
};

export type PopupContextType = {
    confirm: (data: Omit<PopupState, "show">) => void;
    close: () => void;
    showpopup: PopupState;
};