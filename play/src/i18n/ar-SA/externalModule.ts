import type { DeepPartial } from "../DeepPartial";
import type { Translation } from "../i18n-types";

const externalModule: DeepPartial<Translation["externalModule"]> = {
    status: {
        onLine: "الحالة جيدة ✅",
        offLine: "الحالة غير متصلة ❌",
        warning: "الحالة تحذير ⚠️",
        sync: "الحالة تتم المزامنة 🔄",
    },
    teams: {
        openingMeeting: "جاري فتح اجتماع Teams...",
        unableJoinMeeting: "غير قادر على الانضمام إلى اجتماع Teams!",
        userNotConnected: "أنت غير متصل بـ Teams!",
        connectToYourTeams: "اتصل بحساب Teams الخاص بك 🙏",
        temasAppInfo:
            "Teams هو تطبيق Microsoft 365 يساعد فريقك على البقاء متصلًا ومنظمًا. يمكنك الدردشة، الاجتماع، الاتصال، والتعاون في مكان واحد 😍",
        buttonSync: "مزامنة Teams الخاص بي 🚀",
        buttonConnect: "اتصال بـ Teams الخاص بي 🚀",
    },
    discord: {
        integration: "التكامل",
        explainText:
            "من خلال ربط حساب Discord الخاص بك هنا، ستتمكن من تلقي رسائلك مباشرة في دردشة Workadventure. بعد مزامنة الخادم، سنقوم بإنشاء الغرف التي يحتوي عليها، عليك فقط الانضمام إليها في واجهة دردشة Workadventure.",
        login: "اتصل بـ Discord",
        fetchingServer: "جلب خوادم Discord الخاصة بك... 👀",
        qrCodeTitle: "امسح رمز QR باستخدام تطبيق Discord لتسجيل الدخول.",
        qrCodeExplainText:
            "امسح رمز QR باستخدام تطبيق Discord لتسجيل الدخول. رموز QR محدودة الوقت، أحيانًا تحتاج إلى إنشاء رمز جديد",
        qrCodeRegenerate: "احصل على رمز QR جديد",
        tokenInputLabel: "رمز Discord",
        loginToken: "تسجيل الدخول باستخدام الرمز",
        loginTokenExplainText: "تحتاج إلى إدخال رمز Discord الخاص بك. لإجراء تكامل Discord، انظر",
        sendDiscordToken: "إرسال",
        tokenNeeded: "تحتاج إلى إدخال رمز Discord الخاص بك. لإجراء تكامل Discord، انظر",
        howToGetTokenButton: "كيفية الحصول على رمز تسجيل الدخول الخاص بـ Discord",
        loggedIn: "متصل بـ:",
        saveSync: "حفظ ومزامنة",
        logout: "تسجيل الخروج",
        guilds: "خوادم Discord",
        guildExplain: "حدد القنوات التي تريد إضافتها إلى واجهة دردشة Workadventure.\n",
    },
};

export default externalModule;
