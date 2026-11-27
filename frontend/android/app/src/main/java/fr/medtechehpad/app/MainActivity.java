package fr.medtechehpad.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(MedTechNfcPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
