from .database import Base, SessionLocal, engine
from .models import ClientDevice, ClientGroup, ModuleMain, RuleMain, UserAccount
from .security import get_password_hash


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(UserAccount).filter(UserAccount.username == "admin").first():
            db.add(
                UserAccount(
                    username="admin",
                    password_hash=get_password_hash("admin123"),
                    role="super_admin",
                    tenant_id=1,
                    agent_id=None,
                    status=True,
                )
            )
        if not db.query(UserAccount).filter(UserAccount.username == "agent1").first():
            db.add(
                UserAccount(
                    username="agent1",
                    password_hash=get_password_hash("agent123"),
                    role="agent_admin",
                    tenant_id=1,
                    agent_id=1001,
                    status=True,
                )
            )
        if not db.query(UserAccount).filter(UserAccount.username == "17629075264").first():
            db.add(
                UserAccount(
                    username="17629075264",
                    password_hash=get_password_hash("17629075264"),
                    role="agent_admin",
                    tenant_id=1,
                    agent_id=1001,
                    status=True,
                )
            )
        if not db.query(ClientGroup).filter(ClientGroup.group_name == "default").first():
            db.add(ClientGroup(tenant_id=1, agent_id=1001, group_name="default", is_default=True))
        if not db.query(ClientDevice).filter(ClientDevice.device_uuid == "dev-001").first():
            db.add(
                ClientDevice(
                    tenant_id=1,
                    agent_id=1001,
                    group_id=1,
                    device_uuid="dev-001",
                    mac_addr="00-11-22-33-44-55",
                    public_ip="1.1.1.1",
                    hostname="pc-001",
                    os_version="Windows 10 x64",
                    client_version="0.1.0",
                    internet_bar_name="demo_bar",
                    status="online",
                )
            )
        if not db.query(ModuleMain).filter(ModuleMain.module_name == "ControlWindow").first():
            db.add(
                ModuleMain(
                    tenant_id=1,
                    module_name="ControlWindow",
                    module_display_name="窗口控制模块",
                    module_url="https://cdn.example.local/modules/control-window.zip",
                    md5="",
                    signature_sha256="",
                    visible=True,
                    display_order=10,
                    run_possibility=100,
                    module_param_template='{"mode":"standard"}',
                    enabled=True,
                )
            )
        if not db.query(RuleMain).filter(RuleMain.name == "示例-窗口广告规则").first():
            db.add(
                RuleMain(
                    tenant_id=1,
                    agent_id=1001,
                    orgn_share_agent_id=1001,
                    name="示例-窗口广告规则",
                    enable_ad=True,
                    is_share=True,
                    is_hide=False,
                    run_possibility=100,
                    remark="复刻工程内置示例",
                    dir_json='{"*":{"\\\\ads":["noCreate","noWrite"]}}',
                    reg_json="{}",
                    ip_json="{}",
                    ctrl_wnd_json='{"CwRule":[{"ProcessName":"demo.exe","CwWindowProp":[{"WindowText":"广告"}]}]}',
                    anti_thread_json="{}",
                    thread_control_json="{}",
                )
            )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
    print("seed done")

