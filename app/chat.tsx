// app/chat.tsx - Enhanced with Profile Features
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from 'expo-router';
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Clipboard,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

const ChatScreen = () => {
    const router = useRouter();
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    const [showAnimation, setShowAnimation] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showConversations, setShowConversations] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [reportText, setReportText] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const querySuggestions = [
        "Tell me about yourself",
        "Help me plan my day",
        "Explain quantum computing",
        "Write a creative story",
    ];

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            setShowAnimation(false);
            loadConversations();
            loadUserData();
        }, 2000);
    }, []);

    const loadUserData = async () => {
        try {
            const email = await SecureStore.getItemAsync('user_email');
            if (email) setUserEmail(email);
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    const loadConversations = async () => {
        try {
            const stored = await SecureStore.getItemAsync('conversations');
            if (stored) {
                const parsed = JSON.parse(stored);
                setConversations(parsed);
                if (parsed.length > 0) {
                    setCurrentConversation(parsed[0]);
                }
            }
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    };

    const saveConversations = async (convs: Conversation[]) => {
        try {
            await SecureStore.setItemAsync('conversations', JSON.stringify(convs));
        } catch (error) {
            console.error("Error saving conversations:", error);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfilePicture(result.assets[0].uri);
        }
    };

    const createNewConversation = () => {
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const updated = [newConv, ...conversations];
        setConversations(updated);
        setCurrentConversation(newConv);
        saveConversations(updated);
        setShowConversations(false);
    };

    const deleteConversation = (id: string) => {
        Alert.alert(
            "Delete Conversation",
            "Are you sure you want to delete this conversation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const updated = conversations.filter(c => c.id !== id);
                        setConversations(updated);
                        saveConversations(updated);
                        if (currentConversation?.id === id) {
                            setCurrentConversation(updated[0] || null);
                        }
                    },
                },
            ]
        );
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        let conv = currentConversation;
        if (!conv) {
            conv = {
                id: Date.now().toString(),
                title: inputText.slice(0, 30) + (inputText.length > 30 ? '...' : ''),
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const updated = [conv, ...conversations];
            setConversations(updated);
            setCurrentConversation(conv);
            saveConversations(updated);
        }

        const updatedMessages = [...conv.messages, userMessage];
        const updatedConv = {
            ...conv,
            messages: updatedMessages,
            updatedAt: new Date(),
            title: conv.messages.length === 0 ? userMessage.text.slice(0, 30) + (userMessage.text.length > 30 ? '...' : '') : conv.title,
        };

        setCurrentConversation(updatedConv);
        const allConvs = conversations.map(c => c.id === updatedConv.id ? updatedConv : c);
        if (!conversations.find(c => c.id === updatedConv.id)) {
            allConvs.unshift(updatedConv);
        }
        setConversations(allConvs);
        saveConversations(allConvs);

        setInputText("");
        setIsTyping(true);

        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

        // Call Kelly AI backend
        try {
            const response = await fetch(
                `http://10.132.94.222:5002/kelly?q=${encodeURIComponent(inputText)}&id=${currentConversation?.id || "guest"}`
            );

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || "Failed to get AI response");
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: result.data || "No response from AI 😭",
                sender: 'ai',
                timestamp: new Date(),
            };

            const withAiMessage = [...updatedMessages, aiMessage];
            const finalConv = { ...updatedConv, messages: withAiMessage };
            setCurrentConversation(finalConv);
            const finalConvs = allConvs.map(c => c.id === finalConv.id ? finalConv : c);
            setConversations(finalConvs);
            await saveConversations(finalConvs);
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (err) {
            console.error("AI Error:", err);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "Oops 😅 something went wrong while contacting Kelly AI.",
                sender: 'ai',
                timestamp: new Date(),
            };
            const withAiMessage = [...updatedMessages, aiMessage];
            const finalConv = { ...updatedConv, messages: withAiMessage };
            setCurrentConversation(finalConv);
            const finalConvs = allConvs.map(c => c.id === finalConv.id ? finalConv : c);
            setConversations(finalConvs);
            await saveConversations(finalConvs);
            setIsTyping(false);
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await SecureStore.deleteItemAsync('access_token');
                            await SecureStore.deleteItemAsync('refresh_token');
                            await SecureStore.deleteItemAsync('user_id');
                            await SecureStore.deleteItemAsync('user_email');
                            router.replace('/');
                        } catch (error) {
                            console.error("Error during logout:", error);
                            router.replace('/');
                        }
                    },
                },
            ]
        );
    };

    const handleReportIssue = () => {
        if (!reportText.trim()) {
            Alert.alert("Error", "Please describe the issue");
            return;
        }
        Alert.alert("Thank you!", "Your report has been submitted. We'll look into it.");
        setReportText("");
        setShowReportModal(false);
    };

    const copyMessageToClipboard = (text: string) => {
        Clipboard.setString(text);
        Alert.alert("Copied!", "Message copied to clipboard");
    };

    const colors = isDarkMode
        ? { bg1: "#1a1a1a", bg2: "#000000", text: "#fff", textSec: "#f2f2f2", input: "#1a1a1a" }
        : { bg1: "#f5f5f5", bg2: "#ffffff", text: "#1a1a1a", textSec: "#333", input: "#fff" };

    if (showAnimation) {
        return (
            <LinearGradient colors={[colors.bg1, colors.bg2]} style={styles.container}>
                <Animated.View style={[styles.animationContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.animationText}>Kelly AI</Text>
                    <Text style={styles.animationSubtext}>Initializing...</Text>
                </Animated.View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={[colors.bg1, colors.bg2]} style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowConversations(true)} style={styles.headerButton}>
                        <Ionicons name="menu" size={28} color="#ff99cc" />
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: colors.text }]}>Kelly AI</Text>

                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.headerButton}>
                            {profilePicture ? (
                                <Image source={{ uri: profilePicture }} style={styles.headerProfilePic} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={28} color="#ff99cc" />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowReportModal(true)} style={styles.headerButton}>
                            <Ionicons name="alert-circle-outline" size={26} color="#ff99cc" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.headerButton}>
                            <Ionicons name="settings-outline" size={26} color="#ff99cc" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Messages Area */}
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                >
                    {currentConversation && currentConversation.messages.length === 0 && (
                        <View style={styles.emptyChatContainer}>
                            <Ionicons name="chatbubbles-outline" size={80} color="#ff99cc" style={styles.emptyIcon} />
                            <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
                            <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>
                                Try one of these suggestions:
                            </Text>
                            <View style={styles.suggestionsContainer}>
                                {querySuggestions.map((suggestion, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.suggestionChip}
                                        onPress={() => setInputText(suggestion)}
                                    >
                                        <Text style={styles.suggestionText}>{suggestion}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {currentConversation?.messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageBubble,
                                message.sender === 'user' ? styles.userMessage : styles.aiMessage,
                            ]}
                        >
                            {message.sender === 'ai' && (
                                <View style={styles.aiAvatar}>
                                    <Image 
                                        source={{ uri: 'https://files.catbox.moe/lcjomr' }} 
                                        style={styles.aiAvatarImage}
                                    />
                                </View>
                            )}
                            {message.sender === 'user' && (
                                <View style={styles.userAvatar}>
                                    {profilePicture ? (
                                        <Image source={{ uri: profilePicture }} style={styles.userAvatarImage} />
                                    ) : (
                                        <Ionicons name="person" size={20} color="#fff" />
                                    )}
                                </View>
                            )}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onLongPress={() => copyMessageToClipboard(message.text)}
                                style={[
                                    styles.messageContent,
                                    message.sender === 'user' ? styles.userMessageContent : styles.aiMessageContent,
                                    { backgroundColor: message.sender === 'user' ? '#ff66aa' : (isDarkMode ? '#2a2a2a' : '#f0f0f0') }
                                ]}
                            >
                                <Text style={[
                                    styles.messageText,
                                    { color: message.sender === 'user' ? '#fff' : colors.text }
                                ]}>
                                    {message.text}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {isTyping && (
                        <View style={[styles.messageBubble, styles.aiMessage]}>
                            <View style={styles.aiAvatar}>
                                <Image 
                                    source={{ uri: 'https://files.catbox.moe/lcjomr.jpg' }} 
                                    style={styles.aiAvatarImage}
                                />
                            </View>
                            <View style={[styles.typingIndicator, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' }]}>
                                <View style={styles.typingDot} />
                                <View style={styles.typingDot} />
                                <View style={styles.typingDot} />
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: colors.input }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Message Kelly AI..."
                        placeholderTextColor="#ff99cc88"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Profile Modal */}
                <Modal visible={showProfile} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Profile</Text>
                                <TouchableOpacity onPress={() => setShowProfile(false)}>
                                    <Ionicons name="close" size={28} color="#ff99cc" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.profileContent}>
                                <TouchableOpacity onPress={pickImage} style={styles.profilePictureContainer}>
                                    {profilePicture ? (
                                        <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
                                    ) : (
                                        <View style={styles.emptyProfilePicture}>
                                            <Ionicons name="person" size={50} color="#ff99cc" />
                                        </View>
                                    )}
                                    <View style={styles.uploadIconContainer}>
                                        <Ionicons name="camera" size={20} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                
                                <Text style={styles.uploadText}>Upload a profile picture</Text>

                                <View style={styles.profileInfoContainer}>
                                    <View style={styles.profileInfoItem}>
                                        <Ionicons name="mail-outline" size={24} color="#ff99cc" />
                                        <View style={styles.profileInfoTextContainer}>
                                            <Text style={[styles.profileInfoLabel, { color: colors.textSec }]}>Email</Text>
                                            <Text style={[styles.profileInfoValue, { color: colors.text }]}>
                                                {userEmail || 'Not available'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.profileInfoItem}>
                                        <Ionicons name="chatbubbles-outline" size={24} color="#ff99cc" />
                                        <View style={styles.profileInfoTextContainer}>
                                            <Text style={[styles.profileInfoLabel, { color: colors.textSec }]}>Total Chats</Text>
                                            <Text style={[styles.profileInfoValue, { color: colors.text }]}>
                                                {conversations.length}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                                    <Ionicons name="log-out-outline" size={24} color="#fff" />
                                    <Text style={styles.logoutButtonText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Settings Modal */}
                <Modal visible={showSettings} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
                                <TouchableOpacity onPress={() => setShowSettings(false)}>
                                    <Ionicons name="close" size={28} color="#ff99cc" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.settingItem}
                                onPress={() => setIsDarkMode(!isDarkMode)}
                            >
                                <View style={styles.settingLeft}>
                                    <Ionicons
                                        name={isDarkMode ? "moon" : "sunny"}
                                        size={24}
                                        color="#ff99cc"
                                    />
                                    <Text style={[styles.settingText, { color: colors.text }]}>
                                        {isDarkMode ? "Dark Mode" : "Light Mode"}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#ff99cc" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Conversations Modal */}
                <Modal visible={showConversations} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Conversations</Text>
                                <TouchableOpacity onPress={() => setShowConversations(false)}>
                                    <Ionicons name="close" size={28} color="#ff99cc" />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.newChatButton} onPress={createNewConversation}>
                                <Ionicons name="add-circle" size={24} color="#fff" />
                                <Text style={styles.newChatText}>New Chat</Text>
                            </TouchableOpacity>

                            <ScrollView style={styles.conversationsList}>
                                {conversations.map((conv) => (
                                    <View key={conv.id} style={styles.conversationItem}>
                                        <TouchableOpacity
                                            style={styles.conversationTouch}
                                            onPress={() => {
                                                setCurrentConversation(conv);
                                                setShowConversations(false);
                                            }}
                                        >
                                            <Ionicons name="chatbubble-outline" size={20} color="#ff99cc" />
                                            <View style={styles.conversationInfo}>
                                                <Text style={[styles.conversationTitle, { color: colors.text }]} numberOfLines={1}>
                                                    {conv.messages.length > 0 ? conv.messages[0].text : conv.title}
                                                </Text>
                                                <Text style={[styles.conversationDate, { color: colors.textSec }]}>
                                                    {new Date(conv.updatedAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => deleteConversation(conv.id)}>
                                            <Ionicons name="trash-outline" size={20} color="#ff6666" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Report Issue Modal */}
                <Modal visible={showReportModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.reportModal, { backgroundColor: colors.bg1 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Report Issue</Text>
                                <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                    <Ionicons name="close" size={28} color="#ff99cc" />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.reportInput, { color: colors.text, borderColor: '#ff99cc' }]}
                                placeholder="Describe the issue..."
                                placeholderTextColor="#ff99cc88"
                                value={reportText}
                                onChangeText={setReportText}
                                multiline
                                numberOfLines={6}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity style={styles.reportButton} onPress={handleReportIssue}>
                                <Text style={styles.reportButtonText}>Submit Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animationText: {
        fontSize: 52,
        fontFamily: "Lato_700Bold",
        color: "#ff99cc",
        textShadowColor: "#ff66aa",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    animationSubtext: {
        fontSize: 18,
        fontFamily: "Lato_400Regular",
        color: "#ff99cc",
        marginTop: 10,
        opacity: 0.8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 50,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ff99cc22',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: "Lato_700Bold",
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        gap: 5,
    },
    headerProfilePic: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 15,
        paddingBottom: 30,
    },
    emptyChatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyIcon: {
        marginBottom: 20,
        opacity: 0.6,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: "Lato_700Bold",
        marginBottom: 10,
    },
    emptySubtitle: {
        fontSize: 16,
        fontFamily: "Lato_400Regular",
        marginBottom: 25,
    },
    suggestionsContainer: {
        gap: 12,
        width: '100%',
    },
    suggestionChip: {
        backgroundColor: '#ff99cc22',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ff99cc44',
    },
    suggestionText: {
        color: '#ff99cc',
        fontSize: 15,
        fontFamily: "Lato_400Regular",
    },
    messageBubble: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-start',
        width: '100%',
    },
    userMessage: {
        justifyContent: 'flex-end',
        alignSelf: 'flex-end',
    },
    aiMessage: {
        justifyContent: 'flex-start',
        alignSelf: 'flex-start',
    },
    aiAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ff66aa',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        overflow: 'hidden',
    },
    aiAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    aiAvatarText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: "Lato_700Bold",
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#ff66aa',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        overflow: 'hidden',
    },
    userAvatarImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    messageContent: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
    },
    userMessageContent: {
        backgroundColor: '#ff66aa',
    },
    aiMessageContent: {
        backgroundColor: '#1a1a1a',
    },
    messageText: {
        fontSize: 16,
        fontFamily: "Lato_400Regular",
        lineHeight: 22,
    },
    typingIndicator: {
        flexDirection: 'row',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 18,
        gap: 6,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff99cc',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#ff99cc22',
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: "Lato_400Regular",
        maxHeight: 100,
        paddingVertical: 10,
    },
    sendButton: {
        backgroundColor: '#ff66aa',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#ff66aa",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ff99cc22',
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: "Lato_700Bold",
    },
    profileContent: {
        padding: 20,
        alignItems: 'center',
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    profilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#ff99cc',
    },
    emptyProfilePicture: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ff99cc22',
        borderWidth: 3,
        borderColor: '#ff99cc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ff66aa',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1a1a1a',
    },
    uploadText: {
        color: '#ff99cc',
        fontSize: 14,
        fontFamily: "Lato_400Regular",
        marginBottom: 30,
    },
    profileInfoContainer: {
        width: '100%',
        gap: 15,
        marginBottom: 30,
    },
    profileInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff99cc11',
        padding: 15,
        borderRadius: 12,
        gap: 15,
    },
    profileInfoTextContainer: {
        flex: 1,
    },
    profileInfoLabel: {
        fontSize: 13,
        fontFamily: "Lato_400Regular",
        marginBottom: 4,
    },
    profileInfoValue: {
        fontSize: 16,
        fontFamily: "Lato_700Bold",
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff6666',
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
        shadowColor: "#ff6666",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: "Lato_700Bold",
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ff99cc11',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    settingText: {
        fontSize: 17,
        fontFamily: "Lato_400Regular",
    },
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ff66aa',
        marginHorizontal: 20,
        marginVertical: 15,
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
        shadowColor: "#ff66aa",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    newChatText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: "Lato_700Bold",
    },
    conversationsList: {
        paddingHorizontal: 20,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#ff99cc11',
    },
    conversationTouch: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationTitle: {
        fontSize: 16,
        fontFamily: "Lato_400Regular",
        marginBottom: 4,
    },
    conversationDate: {
        fontSize: 13,
        fontFamily: "Lato_400Regular",
        opacity: 0.7,
    },
    reportModal: {
        margin: 20,
        borderRadius: 20,
        padding: 20,
    },
    reportInput: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        fontFamily: "Lato_400Regular",
        marginVertical: 20,
        minHeight: 150,
    },
    reportButton: {
        backgroundColor: '#ff66aa',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#ff66aa",
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: "Lato_700Bold",
    },
});