import { useState } from 'react';
import { User, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { BarChart3, MessageSquare, LogOut, Languages, Heart, Mail, CreditCard } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { UserStatsModal } from './UserStatsModal';
import { LanguagePreferencesModal } from './LanguagePreferencesModal';
import { ContentPreferencesModal } from './ContentPreferencesModal';
import { EmailNotificationPreferencesModal } from './EmailNotificationPreferencesModal';
import { track } from '../../lib/mixpanelClient';

interface UserAvatarProps {
    user: User | null;
}

export function UserAvatar({ user }: UserAvatarProps) {
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [languagePrefsModalOpen, setLanguagePrefsModalOpen] = useState(false);
    const [contentPrefsModalOpen, setContentPrefsModalOpen] = useState(false);
    const [emailPrefsModalOpen, setEmailPrefsModalOpen] = useState(false);

    return (
        <div className="relative">
            {user ? (
                <Menu>
                    <Menu.Button className="flex items-center gap-2 focus:outline-none" title={user.displayName || user.email || "Account"}>
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">
                                {user.displayName?.[0]?.toUpperCase() || "U"}
                            </div>
                        )}
                    </Menu.Button>

                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-background border rounded shadow-lg z-50 focus:outline-none">
                        <div className="p-4 border-b">
                            <div className="font-semibold truncate" title={user.displayName || user.email || "User"}>
                                {user.displayName || user.email || "User"}
                            </div>
                        </div>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                        track('User Stats Clicked');
                                        setStatsModalOpen(true);
                                    }}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    View Stats
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                        track('Language Preferences Clicked');
                                        setLanguagePrefsModalOpen(true);
                                    }}
                                >
                                    <Languages className="w-4 h-4" />
                                    Languages
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                        track('Content Preferences Clicked');
                                        setContentPrefsModalOpen(true);
                                    }}
                                >
                                    <Heart className="w-4 h-4" />
                                    Content Interests
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                        track('Email Preferences Clicked');
                                        setEmailPrefsModalOpen(true);
                                    }}
                                >
                                    <Mail className="w-4 h-4" />
                                    Email Preferences
                                </button>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="https://billing.stripe.com/p/login/00w00je6g17XfrSah6dAk00"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`block w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => track('Manage Subscription Clicked')}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Subscription
                                </a>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <a
                                    href="mailto:hello@lingopaper.com?subject=Feedback for LingoPaper"
                                    className={`block w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => track('Send Feedback Clicked')}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Send Feedback
                                </a>
                            )}
                        </Menu.Item>

                        <Menu.Item>
                            {({ active }) => (
                                <button
                                    className={`w-full text-left px-4 py-2 flex items-center gap-2 ${active ? 'bg-secondary' : ''}`}
                                    onClick={() => {
                                        track('Sign Out Clicked');
                                        signOut(auth);
                                    }}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            )}
                        </Menu.Item>
                    </Menu.Items>
                </Menu>
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

            <UserStatsModal
                isOpen={statsModalOpen}
                onClose={() => setStatsModalOpen(false)}
                user={user!}
            />

            {user && (
                <LanguagePreferencesModal
                    isOpen={languagePrefsModalOpen}
                    onClose={() => setLanguagePrefsModalOpen(false)}
                    user={user}
                />
            )}

            {user && (
                <ContentPreferencesModal
                    isOpen={contentPrefsModalOpen}
                    onClose={() => setContentPrefsModalOpen(false)}
                    user={user}
                />
            )}

            {user && (
                <EmailNotificationPreferencesModal
                    isOpen={emailPrefsModalOpen}
                    onClose={() => setEmailPrefsModalOpen(false)}
                    user={user}
                />
            )}
        </div>
    );
} 