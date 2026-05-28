import { createContext, useContext, useState } from "react";
import type { PopupContextType, PopupState } from "../types/other_types";
import ConfirmPopUp from "../components/ConfirmDialog";

const PopupContext = createContext<PopupContextType | null>(null);

function PopupProvider({ children }: { children: React.ReactNode }) {
    const [showpopup, setShowPopup] = useState<PopupState>({
        show: false,
        text: ""
    });

    const confirm = (data: Omit<PopupState, "show">) => {
        setShowPopup({
            show: true,
            ...data
        });
    };

    const close = () => {
        setShowPopup({
            show: false,
            text: ""
        });
    };

    return (
        <PopupContext.Provider value={{ confirm, close, showpopup }}>
            {children}

            <ConfirmPopUp
                show={showpopup.show}
                text={showpopup.text}
                onClose={close}
                onConfirm={() => {
                    const action = showpopup.onConfirm;
                    close();
                    action?.();
                }}
                showCancel={showpopup.showCancel}
            />
        </PopupContext.Provider>
    );
}

export default PopupProvider

export function usePopup() {
    const popupctx = useContext(PopupContext);
    if (!popupctx) throw new Error("usePopup must be used inside PopupProvider");
    return popupctx;
}