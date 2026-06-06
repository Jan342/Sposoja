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

export type Package = {
    _id: string;
    name: string;
    location: string;
    racketLimit: number;
    racketTotal: number;
    freeTotal?: number;
};

export type RacketData = {
    _id: string;
    model: string;
    description?: string;
    rated?: number;
    path?: string;
    rented?: boolean;
    owner?: string;
    package?: string;
};

export type Member = {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
    assignedPackage?: { _id: string; name: string; location: string } | null;
    rentedPackage?: { _id: string; name: string; location: string } | null;
    rented?: {
        _id: string;
        model: string;
        package?: { _id: string; name: string; location: string } | null;
    } | null;
};

export type LogEntry = {
    _id: string;
    user?: { _id: string; username: string; firstName?: string; lastName?: string } | null;
    racket?: { _id: string; model: string } | null;
    package?: { _id: string; name: string; location: string } | null;
    action: 'izposoja' | 'vrnitev';
    timestamp: string;
};

export type ClubData = {
    _id: string;
    firstname: string;
    lastname: string;
    username: string;
    clubName: string;
    address: string;
    packageCount: Number;
}