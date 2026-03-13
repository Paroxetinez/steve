export type Language = "en" | "zh";

export interface Translations {
  // Discovery
  discovery: {
    questions: string[];
  };
  // Login
  login: {
    title: string;
    subtitle: string;
    phonePlaceholder: string;
    passwordPlaceholder: string;
    confirmPasswordPlaceholder: string;
    loginButton: string;
    registerButton: string;
    loginTab: string;
    registerTab: string;
    loginHint: string;
    registerHint: string;
    stayOnLogin: string;
    phoneInvalid: string;
    passwordTooShort: string;
    passwordsNotMatch: string;
    loginFailed: string;
    registerFailed: string;
  };
  // Profile Setup
  profileSetup: {
    title: string;
    subtitle: string;
    nicknameLabel: string;
    nicknamePlaceholder: string;
    genderLabel: string;
    genderPlaceholder: string;
    male: string;
    female: string;
    other: string;
    birthdayLabel: string;
    yearPlaceholder: string;
    monthPlaceholder: string;
    dayPlaceholder: string;
    cityLabel: string;
    cityPlaceholder: string;
    continueButton: string;
    uploadAvatar: string;
    changeAvatar: string;
    invalidImageType: string;
    imageTooLarge: string;
    uploadFailed: string;
    editTitle: string;
    saveButton: string;
  };
  // Personal Profile
  personalProfile: {
    title: string;
    idLabel: string;
    completeProfileHint: string;
    steveReport: string;
    preferences: string;
    notifications: string;
    signOut: string;
    signingOut: string;
    userPrefix: string;
  };
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    done: string;
    search: string;
    add: string;
    adding: string;
    added: string;
    online: string;
    noData: string;
  };
  // Invitation
  invitation: {
    inviteFriend: string;
    myCodes: string;
    generateCodes: string;
    generating: string;
    copied: string;
    copyContent: string;
    invitePlaceholder: string;
    inviteButton: string;
    invalidCode: string;
    codeNotExist: string;
    codeUsed: string;
    joinSuccess: string;
    onlyJoeCanGenerate: string;
    used: string;
    unused: string;
  };
  // Preferences
  preferences: {
    title: string;
    language: string;
    languageDesc: string;
    english: string;
    chinese: string;
  };
  // Bottom Navigation
  nav: {
    inbox: string;
    discovery: string;
    friends: string;
    profile: string;
  };
  // Search Result
  searchResult: {
    compatibilityTitle: string;
    addFriendButton: string;
    addingButton: string;
    addedButton: string;
    noUser: string;
    failedToAdd: string;
  };
  // Reports
  reports: {
    title: string;
    totalAssists: string;
    icebreaks: string;
    offlineMeetups: string;
    highlightsTitle: string;
    noHighlights: string;
  };
  // Inbox
  inbox: {
    searchPlaceholder: string;
    activeTab: string;
    archivedTab: string;
    noConversations: string;
  };
  // Add Friends
  addFriends: {
    searchPlaceholder: string;
    todayRecommendation: string;
    unknownCity: string;
    addButton: string;
    addingButton: string;
    addedButton: string;
    noUsers: string;
  };
  // Chat
  chat: {
    messagePlaceholder: string;
    regenerateTooltip: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    discovery: {
      questions: [
        "Do you prefer daily chatting in early dating?",
        "Can you accept a long-distance relationship?",
        "Should couples discuss finances before marriage?",
        "Can exes stay friends after a breakup?",
        "Do you prefer direct communication in conflicts?",
      ],
    },
    login: {
      title: "Sign In / Register",
      subtitle: "Use your phone and password to continue.",
      phonePlaceholder: "Phone number",
      passwordPlaceholder: "Password",
      confirmPasswordPlaceholder: "Confirm password",
      loginButton: "Login",
      registerButton: "Register",
      loginTab: "Login",
      registerTab: "Register",
      loginHint: "Log in with your registered phone and password.",
      registerHint: "Register with phone, password, and confirm password.",
      stayOnLogin: "Stay on login page",
      phoneInvalid: "Phone number must be 11 digits",
      passwordTooShort: "Password must be at least 6 characters",
      passwordsNotMatch: "Passwords do not match",
      loginFailed: "Login failed",
      registerFailed: "Registration failed",
    },
    profileSetup: {
      title: "Complete Profile",
      subtitle: "Set up your profile before entering chat.",
      nicknameLabel: "Nickname",
      nicknamePlaceholder: "Enter nickname",
      genderLabel: "Gender",
      genderPlaceholder: "Select gender",
      male: "Male",
      female: "Female",
      other: "Other",
      birthdayLabel: "Birthday",
      yearPlaceholder: "Year",
      monthPlaceholder: "Month",
      dayPlaceholder: "Day",
      cityLabel: "City",
      cityPlaceholder: "Enter city",
      continueButton: "Continue",
      uploadAvatar: "Upload Photo",
      changeAvatar: "Change Photo",
      invalidImageType: "Please select an image file",
      imageTooLarge: "Image size should be less than 5MB",
      uploadFailed: "Upload failed, please try again",
      editTitle: "Edit Profile",
      saveButton: "Save",
    },
    personalProfile: {
      title: "Profile",
      idLabel: "ID",
      completeProfileHint: "Please complete your profile details.",
      steveReport: "Steve report",
      preferences: "Preferences & privacy",
      notifications: "Notifications",
      signOut: "Sign out",
      signingOut: "Signing out...",
      userPrefix: "User",
    },
    common: {
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      done: "Done",
      search: "Search",
      add: "Add",
      adding: "Adding...",
      added: "Added",
      online: "Online",
      noData: "No data",
    },
    invitation: {
      inviteFriend: "Invite Friend",
      myCodes: "My Invitation Codes",
      generateCodes: "Generate Codes",
      generating: "Generating...",
      copied: "Copied!",
      copyContent: "Join me on Steve! Use my invitation code {code} to sign up: https://steve2026.vercel.app",
      invitePlaceholder: "Enter invitation code",
      inviteButton: "Join",
      invalidCode: "Invalid invitation code",
      codeNotExist: "Invitation code does not exist",
      codeUsed: "Invitation code has been used",
      joinSuccess: "Successfully joined!",
      onlyJoeCanGenerate: "Only Joe can generate invitation codes",
      used: "Used",
      unused: "Unused",
    },
    preferences: {
      title: "Preferences",
      language: "Language",
      languageDesc: "Choose your preferred language",
      english: "English",
      chinese: "中文",
    },
    nav: {
      inbox: "Inbox",
      discovery: "Discovery",
      friends: "Friends",
      profile: "Profile",
    },
    searchResult: {
      compatibilityTitle: "Match Info",
      addFriendButton: "Add friend",
      addingButton: "Adding...",
      addedButton: "Added",
      noUser: "No user",
      failedToAdd: "Failed to add friend",
    },
    reports: {
      title: "Steve Report",
      totalAssists: "Milestone events",
      icebreaks: "Relationship warming",
      offlineMeetups: "Offline meetups",
      highlightsTitle: "Highlights",
      noHighlights: "No milestone reports yet. Reports appear only after key milestone events.",
    },
    inbox: {
      searchPlaceholder: "Search friend or record",
      activeTab: "Active",
      archivedTab: "Archived",
      noConversations: "No conversations.",
    },
    addFriends: {
      searchPlaceholder: "Search user ID",
      todayRecommendation: "Today recommendation",
      unknownCity: "Unknown city",
      addButton: "Add",
      addingButton: "Adding...",
      addedButton: "Added",
      noUsers: "No recommended users for now.",
    },
    chat: {
      messagePlaceholder: "Type a message and press Enter...",
      regenerateTooltip: "Regenerate Steve suggestion",
    },
  },
  zh: {
    discovery: {
      questions: [
        "在恋爱初期，你喜欢每天聊天吗？",
        "你能接受异地恋吗？",
        "夫妻应该在婚前讨论财务问题吗？",
        "分手后前任还能做朋友吗？",
        "在冲突中你更倾向于直接沟通吗？",
      ],
    },
    login: {
      title: "登录 / 注册",
      subtitle: "使用手机号和密码继续",
      phonePlaceholder: "手机号",
      passwordPlaceholder: "密码",
      confirmPasswordPlaceholder: "确认密码",
      loginButton: "登录",
      registerButton: "注册",
      loginTab: "登录",
      registerTab: "注册",
      loginHint: "使用已注册的手机号和密码登录",
      registerHint: "使用手机号、密码和确认密码注册",
      stayOnLogin: "保持在登录页面",
      phoneInvalid: "手机号必须是11位数字",
      passwordTooShort: "密码至少需要6个字符",
      passwordsNotMatch: "两次输入的密码不一致",
      loginFailed: "登录失败",
      registerFailed: "注册失败",
    },
    profileSetup: {
      title: "完善资料",
      subtitle: "进入聊天前请先设置您的个人资料",
      nicknameLabel: "昵称",
      nicknamePlaceholder: "请输入昵称",
      genderLabel: "性别",
      genderPlaceholder: "选择性别",
      male: "男",
      female: "女",
      other: "其他",
      birthdayLabel: "生日",
      yearPlaceholder: "年",
      monthPlaceholder: "月",
      dayPlaceholder: "日",
      cityLabel: "城市",
      cityPlaceholder: "请输入城市",
      continueButton: "继续",
      uploadAvatar: "上传头像",
      changeAvatar: "更换头像",
      invalidImageType: "请选择图片文件",
      imageTooLarge: "图片大小不能超过5MB",
      uploadFailed: "上传失败，请重试",
      editTitle: "编辑资料",
      saveButton: "保存",
    },
    personalProfile: {
      title: "个人资料",
      idLabel: "ID",
      completeProfileHint: "请完善您的个人资料",
      steveReport: "Steve 报告",
      preferences: "偏好设置与隐私",
      notifications: "通知",
      signOut: "退出登录",
      signingOut: "正在退出...",
      userPrefix: "用户",
    },
    common: {
      loading: "加载中...",
      save: "保存",
      cancel: "取消",
      confirm: "确认",
      back: "返回",
      next: "下一步",
      done: "完成",
      search: "搜索",
      add: "添加",
      adding: "添加中...",
      added: "已添加",
      online: "在线",
      noData: "暂无数据",
    },
    invitation: {
      inviteFriend: "邀请好友",
      myCodes: "我的邀请码",
      generateCodes: "生成邀请码",
      generating: "生成中...",
      copied: "已复制!",
      copyContent: "一起来玩 Steve！使用我的邀请码 {code} 注册吧：https://steve2026.vercel.app",
      invitePlaceholder: "输入邀请码",
      inviteButton: "加入",
      invalidCode: "邀请码无效",
      codeNotExist: "邀请码不存在",
      codeUsed: "邀请码已被使用",
      joinSuccess: "加入成功！",
      onlyJoeCanGenerate: "只有 Joe 才能生成邀请码",
      used: "已使用",
      unused: "未使用",
    },
    preferences: {
      title: "偏好设置",
      language: "语言",
      languageDesc: "选择您偏好的语言",
      english: "English",
      chinese: "中文",
    },
    nav: {
      inbox: "聊天",
      discovery: "发现",
      friends: "好友",
      profile: "我的",
    },
    searchResult: {
      compatibilityTitle: "匹配信息",
      addFriendButton: "添加好友",
      addingButton: "添加中...",
      addedButton: "已添加",
      noUser: "无用户",
      failedToAdd: "添加好友失败",
    },
    reports: {
      title: "Steve 报告",
      totalAssists: "里程碑事件",
      icebreaks: "关系升温",
      offlineMeetups: "线下见面",
      highlightsTitle: "亮点",
      noHighlights: "暂无里程碑报告。仅在关键里程碑事件后生成报告。",
    },
    inbox: {
      searchPlaceholder: "搜索好友或记录",
      activeTab: "活跃",
      archivedTab: "已归档",
      noConversations: "暂无对话",
    },
    addFriends: {
      searchPlaceholder: "搜索用户ID",
      todayRecommendation: "今日推荐",
      unknownCity: "未知城市",
      addButton: "添加",
      addingButton: "添加中...",
      addedButton: "已添加",
      noUsers: "暂无推荐用户",
    },
    chat: {
      messagePlaceholder: "输入消息并按回车发送...",
      regenerateTooltip: "重新生成 Steve 建议",
    },
  },
};
