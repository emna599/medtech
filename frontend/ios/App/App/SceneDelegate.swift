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
        let entitlements = Bundle.main.object(forInfoDictionaryKey: "MedTechNfcEntitlements") as? String
        if entitlements == "App/App.entitlements" {
            bridge?.registerPluginInstance(MedTechNfcPlugin())
        }
    }
}

@objc(MedTechNfcPlugin)
final class MedTechNfcPlugin: CAPPlugin, CAPBridgedPlugin, NFCTagReaderSessionDelegate {
    let identifier = "MedTechNfcPlugin"
    let jsName = "MedTechNfc"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "scan", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]

    private var session: NFCTagReaderSession?
    private var pendingCall: CAPPluginCall?

    @objc func scan(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard NFCTagReaderSession.readingAvailable else {
                call.reject("La lecture NFC est indisponible sur cet iPhone.")
                return
            }
            guard self.session == nil else {
                call.reject("Une lecture NFC est déjà en cours.")
                return
            }
            guard let session = NFCTagReaderSession(pollingOption: [.iso14443, .iso15693], delegate: self, queue: .main) else {
                call.reject("Impossible de démarrer la lecture NFC.")
                return
            }
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

    func tagReaderSessionDidBecomeActive(_ session: NFCTagReaderSession) {}

    func tagReaderSession(_ session: NFCTagReaderSession, didDetect tags: [NFCTag]) {
        guard self.session === session else { return }
        guard tags.count == 1, let tag = tags.first else {
            session.alertMessage = "Présentez un seul badge ou bracelet."
            session.restartPolling()
            return
        }

        let ndef: NFCNDEFTag
        let identifier: Data
        switch tag {
        case .miFare(let mifare):
            ndef = mifare
            identifier = mifare.identifier
        case .iso7816(let iso7816):
            ndef = iso7816
            identifier = iso7816.identifier
        case .iso15693(let iso15693):
            ndef = iso15693
            identifier = iso15693.identifier
        default:
            fail(session, "Cette puce NFC n’est pas prise en charge.")
            return
        }

        session.connect(to: tag) { error in
            guard self.session === session, self.pendingCall != nil else { return }
            guard error == nil else {
                self.fail(session, "Connexion à la puce impossible. Approchez-la de nouveau.")
                return
            }
            ndef.readNDEF { message, _ in
                guard self.session === session, let call = self.pendingCall else { return }
                let text = message?.records.lazy.compactMap { record in
                    (record.wellKnownTypeTextPayload().0 ?? record.wellKnownTypeURIPayload()?.absoluteString)?
                        .trimmingCharacters(in: .whitespacesAndNewlines)
                }.first { !$0.isEmpty }
                let serial = identifier.map { String(format: "%02X", $0) }.joined(separator: ":")
                guard let code = text ?? (serial.isEmpty ? nil : serial) else {
                    self.fail(session, "Cette puce ne fournit pas de code lisible.")
                    return
                }
                self.pendingCall = nil
                session.alertMessage = "Puce NFC lue."
                call.resolve(["code": code])
                session.invalidate()
            }
        }
    }

    private func fail(_ session: NFCTagReaderSession, _ message: String) {
        pendingCall?.reject(message)
        pendingCall = nil
        session.invalidate(errorMessage: message)
    }

    func tagReaderSession(_ session: NFCTagReaderSession, didInvalidateWithError error: Error) {
        guard self.session === session else { return }
        self.session = nil
        let call = pendingCall
        pendingCall = nil
        let nfcError = error as? NFCReaderError
        if nfcError?.code == .readerSessionInvalidationErrorUserCanceled {
            call?.reject("Lecture NFC annulée.")
        } else {
            call?.reject("Lecture NFC impossible. Saisissez le code du badge si la lecture échoue.")
        }
    }
}
