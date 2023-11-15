public with sharing class GMOPaymentService extends AbstractGMOPaymentService {
  public GMOPaymentService() {
    super(GMOSiteAPIClient.getInstance(), GMOShopAPIClient.getInstance());
  }
}
