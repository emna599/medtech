import UIKit
import CoreNFC
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = MedTechBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

final class MedTechBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MedTechNfcPlugin())
    }
}

@objc(MedTechNfcPlugin)
final class MedTechNfcPlugin: CAPPlugin, CAPBridgedPlugin, NFCNDEFReaderSessionDelegate {
    let identifier = "MedTechNfcPlugin"
    let jsName = "MedTechNfc"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]

    private var session: NFCNDEFReaderSession?
    private var pendingCall: CAPPluginCall?

    @objc func scan(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard NFCNDEFReaderSession.readingAvailable else {
                call.reject("La lecture NFC est indisponible sur cet iPhone.")
                return
            }
            guard self.session == nil else {
                call.reject("Une lecture NFC est déjà en cours.")
                return
            }
            let session = NFCNDEFReaderSession(delegate: self, queue: .main, invalidateAfterFirstRead: true)
            session.alertMessage = "Approchez le haut de l’iPhone du badge ou du bracelet NFC."
            self.session = session
            self.pendingCall = call
            session.begin()
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.session?.invalidate()
            call.resolve()
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        guard self.session === session else { return }
        let call = pendingCall
        pendingCall = nil
        for record in messages.flatMap({ $0.records }) {
            let text = record.wellKnownTypeTextPayload().0
            let url = record.wellKnownTypeURIPayload()?.absoluteString
            if let code = (text ?? url)?.trimmingCharacters(in: .whitespacesAndNewlines), !code.isEmpty {
                call?.resolve(["code": code])
                return
            }
        }
        call?.reject("Puce détectée, mais aucun code NFC lisible. Saisissez le code indiqué sur le badge.")
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        guard self.session === session else { return }
        self.session = nil
        let call = pendingCall
        pendingCall = nil
        let nfcError = error as? NFCReaderError
        if nfcError?.code == .readerSessionInvalidationErrorUserCanceled {
            call?.reject("Lecture NFC annulée.")
        } else {
            call?.reject("Lecture NFC impossible. Essayez une puce NDEF ou saisissez le code du badge.")
        }
    }
}
