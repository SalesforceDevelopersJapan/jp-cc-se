public with sharing class GMOPaymentNCService extends AbstractGMOPaymentService {
  public GMOPaymentNCService() {
    super(GMOSiteAPINCClient.getInstance(), GMOShopAPINCClient.getInstance());
  }
}
