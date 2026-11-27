package fr.medtechehpad.app;

import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;

@CapacitorPlugin(name = "MedTechNfc")
public class MedTechNfcPlugin extends Plugin {
    private NfcAdapter reader;
    private PluginCall pending;

    @PluginMethod
    public void scan(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pending != null) {
                call.reject("Une lecture NFC est déjà en cours.");
                return;
            }
            NfcAdapter adapter = NfcAdapter.getDefaultAdapter(getActivity());
            if (adapter == null || !adapter.isEnabled()) {
                call.reject("Le NFC est indisponible. Vérifiez les réglages du téléphone.");
                return;
            }
            reader = adapter;
            pending = call;
            try {
                reader.enableReaderMode(
                    getActivity(),
                    tag -> getActivity().runOnUiThread(() -> finishReading(call, tag)),
                    NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_NFC_B
                        | NfcAdapter.FLAG_READER_NFC_F | NfcAdapter.FLAG_READER_NFC_V,
                    null
                );
            } catch (IllegalStateException | UnsupportedOperationException error) {
                pending = null;
                reader = null;
                call.reject("Impossible de démarrer le lecteur NFC.");
            }
        });
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            endScan();
            call.resolve();
        });
    }

    @Override
    protected void handleOnPause() {
        endScan();
    }

    private void endScan() {
        PluginCall call = pending;
        pending = null;
        stopReader();
        if (call != null) call.reject("Lecture NFC annulée.");
    }

    private void stopReader() {
        NfcAdapter adapter = reader;
        reader = null;
        if (adapter != null) {
            try {
                adapter.disableReaderMode(getActivity());
            } catch (IllegalStateException | UnsupportedOperationException ignored) {
                // Le système peut avoir arrêté la lecture lors de la mise en arrière-plan.
            }
        }
    }

    private void finishReading(PluginCall call, Tag tag) {
        if (pending != call) return;
        pending = null;
        stopReader();
        String code = ndefValue(tag);
        if (code == null) {
            byte[] identifier = tag.getId();
            StringBuilder value = new StringBuilder();
            for (byte part : identifier) {
                if (value.length() > 0) value.append(':');
                value.append(String.format(Locale.ROOT, "%02X", part & 0xff));
            }
            code = value.toString();
        }
        if (code.isEmpty()) {
            call.reject("Cette puce ne fournit pas de code lisible.");
            return;
        }
        JSObject result = new JSObject();
        result.put("code", code);
        call.resolve(result);
    }

    private String ndefValue(Tag tag) {
        Ndef ndef = Ndef.get(tag);
        NdefMessage message = ndef == null ? null : ndef.getCachedNdefMessage();
        if (message == null) return null;
        for (NdefRecord record : message.getRecords()) {
            if (record.getTnf() != NdefRecord.TNF_WELL_KNOWN) continue;
            String value = null;
            if (Arrays.equals(record.getType(), NdefRecord.RTD_TEXT)) {
                byte[] bytes = record.getPayload();
                if (bytes.length == 0) continue;
                int start = (bytes[0] & 0x3f) + 1;
                if (start > bytes.length) continue;
                value = new String(bytes, start, bytes.length - start,
                    (bytes[0] & 0x80) == 0 ? StandardCharsets.UTF_8 : StandardCharsets.UTF_16);
            } else if (Arrays.equals(record.getType(), NdefRecord.RTD_URI) && record.toUri() != null) {
                value = record.toUri().toString();
            }
            if (value != null && !value.trim().isEmpty()) return value.trim();
        }
        return null;
    }
}
