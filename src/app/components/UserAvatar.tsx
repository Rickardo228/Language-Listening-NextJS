import { useRef, useEffect } from 'react';
import { User, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

interface UserAvatarProps {
    user: User | null;
    avatarDialogOpen: boolean;
    setAvatarDialogOpen: (open: boolean) => void;
}

export function UserAvatar({ user, avatarDialogOpen, setAvatarDialogOpen }: UserAvatarProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                setAvatarDialogOpen(false);
            }
        }

        if (avatarDialogOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [avatarDialogOpen, setAvatarDialogOpen]);

    return (
        <div className="relative" ref={dialogRef}>
            {user ? (
                <button
                    className="flex items-center gap-2 focus:outline-none"
                    onClick={() => setAvatarDialogOpen(true)}
                    title={user.displayName || user.email || "Account"}
                >
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                            {user.displayName?.[0]?.toUpperCase() || "U"}
                        </div>
                    )}
                </button>
            ) : (
                <button
                    className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                    onClick={() => {
                        const provider = new GoogleAuthProvider();
                        signInWithPopup(auth, provider).catch(console.error);
                    }}
                >
                    Sign In / Create Account
                </button>
            )}

            {/* Dialog */}
            {avatarDialogOpen && user && (
                <div className="absolute right-0 mt-2 w-48 bg-background border rounded shadow-lg z-50">
                    <div className="p-4 border-b">
                        <div className="font-semibold">{user.displayName || user.email}</div>
                    </div>
                    <button
                        className="w-full text-left px-4 py-2 hover:bg-secondary"
                        onClick={() => {
                            signOut(auth);
                            setAvatarDialogOpen(false);
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
} 